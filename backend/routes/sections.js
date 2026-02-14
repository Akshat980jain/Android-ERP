// routes/sections.js
const express = require('express');
const Section = require('../models/Section');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: get effective admin type
const getEffectiveAdminType = (user) => {
    return user.adminType || ((!user.adminPrograms || !user.adminPrograms.length) ? 'head' : 'program');
};

// Helper: build scoped query based on admin type
const buildScopedQuery = (user) => {
    const query = {};
    const effectiveAdminType = getEffectiveAdminType(user);

    if (effectiveAdminType === 'branch') {
        query.program = user.program || (user.adminPrograms && user.adminPrograms[0]);
        if (user.branch) query.branch = user.branch;
    } else if (effectiveAdminType === 'program') {
        if (user.adminPrograms && user.adminPrograms.length > 0) {
            query.program = { $in: user.adminPrograms };
        }
    }
    // head admin: no filter (sees all)
    return query;
};

// ──────────────────────────────────────
// GET /api/sections — List sections
// ──────────────────────────────────────
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { semester, program, branch, academicYear, status } = req.query;
        const query = buildScopedQuery(req.user);

        if (semester) query.semester = Number(semester);
        if (program && !query.program) query.program = program;
        if (branch && !query.branch) query.branch = branch;
        if (academicYear) query.academicYear = academicYear;
        if (status) query.status = status;
        else query.status = 'active'; // default to active

        const sections = await Section.find(query)
            .populate('students', 'name email profile.studentId profile.semester profile.section')
            .populate('createdBy', 'name email')
            .sort({ semester: 1, name: 1 });

        res.json({
            success: true,
            sections,
            count: sections.length
        });
    } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sections' });
    }
});

// ──────────────────────────────────────
// POST /api/sections — Create section
// ──────────────────────────────────────
router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, semester, program, branch, academicYear, maxStudents } = req.body;

        // Validation
        if (!name || !semester || !program || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Name, semester, program, and academic year are required'
            });
        }

        if (semester < 1 || semester > 8) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be between 1 and 8'
            });
        }

        // Branch admin scope check
        const effectiveAdminType = getEffectiveAdminType(req.user);
        if (effectiveAdminType === 'branch') {
            const userProgram = req.user.program || (req.user.adminPrograms && req.user.adminPrograms[0]);
            if (program !== userProgram) {
                return res.status(403).json({ success: false, message: 'You can only create sections in your own program' });
            }
            if (req.user.branch && branch !== req.user.branch) {
                return res.status(403).json({ success: false, message: 'You can only create sections in your own branch' });
            }
        } else if (effectiveAdminType === 'program') {
            if (req.user.adminPrograms && !req.user.adminPrograms.includes(program)) {
                return res.status(403).json({ success: false, message: 'You can only create sections in your assigned programs' });
            }
        }

        const section = new Section({
            name: name.toUpperCase().trim(),
            semester,
            program,
            branch: branch || '',
            academicYear,
            maxStudents: maxStudents || 60,
            createdBy: req.user._id,
            status: 'active'
        });

        await section.save();

        res.status(201).json({
            success: true,
            message: 'Section created successfully',
            section
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A section with this name already exists for the given semester, program, branch, and academic year'
            });
        }
        console.error('Error creating section:', error);
        res.status(500).json({ success: false, message: 'Failed to create section' });
    }
});

// ──────────────────────────────────────
// PUT /api/sections/bulk-semester — Bulk update semester
// ──────────────────────────────────────
router.put('/bulk-semester', auth, authorize('admin'), async (req, res) => {
    try {
        const { sectionIds, newSemester } = req.body;

        if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'sectionIds array is required' });
        }
        if (!newSemester || newSemester < 1 || newSemester > 8) {
            return res.status(400).json({ success: false, message: 'newSemester must be between 1 and 8' });
        }

        // Scope check: ensure admin can access all these sections
        const scopeQuery = buildScopedQuery(req.user);
        scopeQuery._id = { $in: sectionIds };

        const sections = await Section.find(scopeQuery);
        if (sections.length !== sectionIds.length) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update all selected sections'
            });
        }

        // Update sections
        await Section.updateMany(
            { _id: { $in: sectionIds } },
            { $set: { semester: newSemester } }
        );

        // Sync student profiles
        const allStudentIds = [];
        sections.forEach(s => {
            if (s.students && s.students.length > 0) {
                allStudentIds.push(...s.students);
            }
        });

        if (allStudentIds.length > 0) {
            await User.updateMany(
                { _id: { $in: allStudentIds } },
                { $set: { 'profile.semester': String(newSemester) } }
            );
        }

        res.json({
            success: true,
            message: `Updated ${sections.length} section(s) to semester ${newSemester}`,
            updatedCount: sections.length,
            studentsUpdated: allStudentIds.length
        });
    } catch (error) {
        console.error('Error bulk updating semesters:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk update semesters' });
    }
});

// ──────────────────────────────────────
// PUT /api/sections/:id — Update section
// ──────────────────────────────────────
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, semester, academicYear, maxStudents, status } = req.body;

        // Check scope
        const scopeQuery = buildScopedQuery(req.user);
        scopeQuery._id = req.params.id;

        const section = await Section.findOne(scopeQuery);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found or access denied' });
        }

        // Update fields
        if (name) section.name = name.toUpperCase().trim();
        if (semester !== undefined) {
            if (semester < 1 || semester > 8) {
                return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8' });
            }
            const oldSemester = section.semester;
            section.semester = semester;

            // Sync student profiles if semester changed
            if (oldSemester !== semester && section.students.length > 0) {
                await User.updateMany(
                    { _id: { $in: section.students } },
                    { $set: { 'profile.semester': String(semester) } }
                );
            }
        }
        if (academicYear) section.academicYear = academicYear;
        if (maxStudents) section.maxStudents = maxStudents;
        if (status) section.status = status;

        await section.save();

        res.json({
            success: true,
            message: 'Section updated successfully',
            section
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A section with this name already exists for the given semester, program, branch, and academic year'
            });
        }
        console.error('Error updating section:', error);
        res.status(500).json({ success: false, message: 'Failed to update section' });
    }
});

// ──────────────────────────────────────
// POST /api/sections/:id/students — Add students
// ──────────────────────────────────────
router.post('/:id/students', auth, authorize('admin'), async (req, res) => {
    try {
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'studentIds array is required' });
        }

        // Check scope
        const scopeQuery = buildScopedQuery(req.user);
        scopeQuery._id = req.params.id;

        const section = await Section.findOne(scopeQuery);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found or access denied' });
        }

        // Check max students
        const currentCount = section.students.length;
        const newTotal = currentCount + studentIds.length;
        if (newTotal > section.maxStudents) {
            return res.status(400).json({
                success: false,
                message: `Cannot add ${studentIds.length} students. Section capacity is ${section.maxStudents}, currently has ${currentCount} students.`
            });
        }

        // Add students (avoid duplicates)
        const existingIds = new Set(section.students.map(id => id.toString()));
        const newStudentIds = studentIds.filter(id => !existingIds.has(id.toString()));

        if (newStudentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All selected students are already in this section'
            });
        }

        section.students.push(...newStudentIds);
        await section.save();

        // Sync student profiles
        await User.updateMany(
            { _id: { $in: newStudentIds } },
            {
                $set: {
                    'profile.section': section.name,
                    'profile.semester': String(section.semester)
                }
            }
        );

        res.json({
            success: true,
            message: `Added ${newStudentIds.length} student(s) to section ${section.name}`,
            addedCount: newStudentIds.length,
            totalStudents: section.students.length
        });
    } catch (error) {
        console.error('Error adding students to section:', error);
        res.status(500).json({ success: false, message: 'Failed to add students' });
    }
});

// ──────────────────────────────────────
// DELETE /api/sections/:id/students — Remove students
// ──────────────────────────────────────
router.delete('/:id/students', auth, authorize('admin'), async (req, res) => {
    try {
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'studentIds array is required' });
        }

        // Check scope
        const scopeQuery = buildScopedQuery(req.user);
        scopeQuery._id = req.params.id;

        const section = await Section.findOne(scopeQuery);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found or access denied' });
        }

        const removeSet = new Set(studentIds.map(id => id.toString()));
        section.students = section.students.filter(id => !removeSet.has(id.toString()));
        await section.save();

        // Clear student profiles
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $set: { 'profile.section': '', 'profile.semester': '' } }
        );

        res.json({
            success: true,
            message: `Removed ${studentIds.length} student(s) from section ${section.name}`,
            removedCount: studentIds.length,
            totalStudents: section.students.length
        });
    } catch (error) {
        console.error('Error removing students from section:', error);
        res.status(500).json({ success: false, message: 'Failed to remove students' });
    }
});

// ──────────────────────────────────────
// DELETE /api/sections/:id — Archive/delete section
// ──────────────────────────────────────
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        // Check scope
        const scopeQuery = buildScopedQuery(req.user);
        scopeQuery._id = req.params.id;

        const section = await Section.findOne(scopeQuery);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found or access denied' });
        }

        // Archive instead of hard delete
        section.status = 'archived';
        await section.save();

        res.json({
            success: true,
            message: `Section ${section.name} archived successfully`
        });
    } catch (error) {
        console.error('Error archiving section:', error);
        res.status(500).json({ success: false, message: 'Failed to archive section' });
    }
});

module.exports = router;
