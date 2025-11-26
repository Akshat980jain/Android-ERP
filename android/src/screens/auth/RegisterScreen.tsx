import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  ActivityIndicator,
  Surface,
  RadioButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    course: '',
    branch: '',
    role: 'student',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const { register } = useAuth();

  const regularCourses = [
    'B.Tech',
    'M.Tech',
    'MBA',
    'MCA',
    'B.Pharma',
    'M.Pharma',
  ];

  const adminCourses = [
    'Head Admin (No specific program)',
    'B.Tech',
    'M.Tech',
    'B.Pharma',
    'MCA',
    'MBA',
  ];

  // Determine which course list to use based on role
  const courses = formData.role === 'admin' ? adminCourses : regularCourses;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, phone, course, branch, role } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Course is not required for Librarian role
    if (role !== 'librarian' && !course) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    // Branch is required for B.Tech/M.Tech (Head Admin won't reach this since it's not B.Tech/M.Tech)
    if ((course === 'B.Tech' || course === 'M.Tech') && !branch) {
      Alert.alert('Error', 'Please enter your branch');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Determine program for admin role
      let program = course;
      if (role === 'admin') {
        if (course === 'Head Admin (No specific program)') {
          program = undefined; // Head admin has no program restriction
        }
      }

      const response = await register({
        firstName,
        lastName,
        email,
        password,
        phone,
        ...(role !== 'librarian' && { 
          course,
          ...(course === 'B.Tech' || course === 'M.Tech') && { branch },
          ...(role === 'admin' && { program }) // Send program field for admin
        }),
        role,
      });

      if (response.success) {
        Alert.alert(
          'Registration Request Submitted',
          'Your registration request has been submitted. Please wait for admin approval before you can login.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', response.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.background}>
        {/* Subtle dark pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternCircle, styles.patternCircle1]} />
          <View style={[styles.patternCircle, styles.patternCircle2]} />
          <View style={[styles.patternCircle, styles.patternCircle3]} />
        </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Professional Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Ionicons name="school" size={40} color="#3B82F6" />
                </View>
          </View>
              <Text style={styles.title}>EduConnect</Text>
              <Text style={styles.subtitle}>Create Your Account</Text>
            </Animated.View>

            {/* Register Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <Surface style={styles.card} elevation={5}>
                <View style={styles.cardHeader}>
                  <Text style={styles.welcomeTitle}>Join Us</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Sign up to access your educational platform
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  {/* Name Row */}
              <View style={styles.row}>
                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="person-outline" size={20} color="#6366F1" />
                      </View>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  mode="outlined"
                        style={styles.input}
                        outlineColor="#334155"
                        activeOutlineColor="#3B82F6"
                        textColor="#FFFFFF"
                        theme={{
                          colors: {
                            primary: '#3B82F6',
                            background: '#1E293B',
                            text: '#FFFFFF',
                            placeholder: '#64748B',
                          }
                        }}
                      />
                    </View>

                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="person-outline" size={20} color="#6366F1" />
                      </View>
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  mode="outlined"
                        style={styles.input}
                        outlineColor="#334155"
                        activeOutlineColor="#3B82F6"
                        textColor="#FFFFFF"
                        theme={{
                          colors: {
                            primary: '#3B82F6',
                            background: '#1E293B',
                            text: '#FFFFFF',
                            placeholder: '#64748B',
                          }
                        }}
                      />
                    </View>
              </View>

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                    </View>
              <TextInput
                      label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#6366F1"
                      theme={{
                        colors: {
                          primary: '#6366F1',
                          background: '#FFFFFF',
                        }
                      }}
                    />
                  </View>

                  {/* Phone */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="call-outline" size={20} color="#3B82F6" />
                    </View>
              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                      outlineColor="#334155"
                      activeOutlineColor="#3B82F6"
                      textColor="#FFFFFF"
                      theme={{
                        colors: {
                          primary: '#3B82F6',
                          background: '#1E293B',
                          text: '#FFFFFF',
                          placeholder: '#64748B',
                        }
                      }}
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#3B82F6" />
                    </View>
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                      secureTextEntry={!showPassword}
                style={styles.input}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#6366F1"
                      theme={{
                        colors: {
                          primary: '#6366F1',
                          background: '#FFFFFF',
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#64748B" 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
                    </View>
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                mode="outlined"
                      secureTextEntry={!showConfirmPassword}
                style={styles.input}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#6366F1"
                      theme={{
                        colors: {
                          primary: '#6366F1',
                          background: '#FFFFFF',
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#64748B" 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Role Selection */}
              <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>Account Type</Text>
                    
                    {/* Student - Full Width */}
                    <TouchableOpacity
                      style={[
                        styles.roleCard,
                        styles.roleCardFull,
                        formData.role === 'student' && styles.roleCardActive
                      ]}
                      onPress={() => handleInputChange('role', 'student')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.roleCardContent}>
                        <Ionicons 
                          name="book-outline" 
                          size={18} 
                          color={formData.role === 'student' ? '#3B82F6' : '#64748B'} 
                        />
                        <Text style={[
                          styles.roleText,
                          formData.role === 'student' && styles.roleTextActive
                        ]}>
                          Student
                        </Text>
                      </View>
                    <RadioButton
                      value="student"
                      status={formData.role === 'student' ? 'checked' : 'unchecked'}
                        color="#3B82F6"
                      />
                    </TouchableOpacity>

                    {/* Row 1: Faculty & Admin */}
                    <View style={styles.roleRow}>
                      <TouchableOpacity
                        style={[
                          styles.roleCard,
                          styles.roleCardHalf,
                          formData.role === 'faculty' && styles.roleCardActive
                        ]}
                        onPress={() => handleInputChange('role', 'faculty')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.roleCardContent}>
                          <Ionicons 
                            name="school-outline" 
                            size={18} 
                            color={formData.role === 'faculty' ? '#3B82F6' : '#64748B'} 
                          />
                          <Text style={[
                            styles.roleText,
                            formData.role === 'faculty' && styles.roleTextActive
                          ]}>
                            Faculty
                          </Text>
                  </View>
                    <RadioButton
                      value="faculty"
                      status={formData.role === 'faculty' ? 'checked' : 'unchecked'}
                          color="#3B82F6"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleCard,
                          styles.roleCardHalf,
                          formData.role === 'admin' && styles.roleCardActive
                        ]}
                        onPress={() => {
                          handleInputChange('role', 'admin');
                          // Clear course and branch when switching to admin (different course options)
                          handleInputChange('course', '');
                          handleInputChange('branch', '');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.roleCardContent}>
                          <Ionicons 
                            name="shield-checkmark-outline" 
                            size={18} 
                            color={formData.role === 'admin' ? '#3B82F6' : '#64748B'} 
                          />
                          <Text style={[
                            styles.roleText,
                            formData.role === 'admin' && styles.roleTextActive
                          ]}>
                            Admin
                          </Text>
                        </View>
                        <RadioButton
                          value="admin"
                          status={formData.role === 'admin' ? 'checked' : 'unchecked'}
                          color="#3B82F6"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Row 2: Librarian & Placement Officer */}
                    <View style={styles.roleRow}>
                      <TouchableOpacity
                        style={[
                          styles.roleCard,
                          styles.roleCardHalf,
                          formData.role === 'librarian' && styles.roleCardActive
                        ]}
                            onPress={() => {
                              handleInputChange('role', 'librarian');
                              // Clear course and branch when selecting librarian
                              handleInputChange('course', '');
                              handleInputChange('branch', '');
                            }}
                            activeOpacity={0.7}
                          >
                        <View style={styles.roleCardContent}>
                          <Ionicons 
                            name="library-outline" 
                            size={18} 
                            color={formData.role === 'librarian' ? '#3B82F6' : '#64748B'} 
                          />
                          <Text style={[
                            styles.roleText,
                            formData.role === 'librarian' && styles.roleTextActive
                          ]}>
                            Librarian
                          </Text>
                        </View>
                        <RadioButton
                          value="librarian"
                          status={formData.role === 'librarian' ? 'checked' : 'unchecked'}
                          color="#3B82F6"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleCard,
                          styles.roleCardHalf,
                          formData.role === 'placement' && styles.roleCardActive
                        ]}
                        onPress={() => handleInputChange('role', 'placement')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.roleCardContent}>
                          <Ionicons 
                            name="briefcase-outline" 
                            size={18} 
                            color={formData.role === 'placement' ? '#3B82F6' : '#64748B'} 
                          />
                          <Text 
                            style={[
                              styles.roleText,
                              formData.role === 'placement' && styles.roleTextActive
                            ]}
                            numberOfLines={1}
                          >
                            Placement
                          </Text>
                        </View>
                        <RadioButton
                          value="placement"
                          status={formData.role === 'placement' ? 'checked' : 'unchecked'}
                          color="#3B82F6"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Course Selection - Hidden for Librarian role */}
                  {formData.role !== 'librarian' && (
                  <View style={styles.courseContainer}>
                    <Text style={styles.courseLabel}>Select Course</Text>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="book" size={20} color="#3B82F6" />
                      </View>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowCourseDropdown(!showCourseDropdown)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownPlaceholder,
                          formData.course && styles.dropdownSelected
                        ]}>
                          {formData.course || 'Select a course'}
                        </Text>
                        <Ionicons 
                          name={showCourseDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748B" 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {showCourseDropdown && (
                      <View style={styles.dropdownListWrapper}>
                        {courses.map((course, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              formData.course === course && styles.dropdownItemActive,
                              index === courses.length - 1 && styles.dropdownItemLast
                            ]}
                            onPress={() => {
                              handleInputChange('course', course);
                              setShowCourseDropdown(false);
                              // Clear branch if switching away from B.Tech/M.Tech
                              if (course !== 'B.Tech' && course !== 'M.Tech') {
                                handleInputChange('branch', '');
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              formData.course === course && styles.dropdownItemTextActive
                            ]}>
                              {course}
                            </Text>
                            {formData.course === course && (
                              <Ionicons name="checkmark" size={20} color="#3B82F6" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  )}

                  {/* Branch Input - Appears when B.Tech/M.Tech is selected (Head Admin automatically excluded) */}
                  {(formData.course === 'B.Tech' || formData.course === 'M.Tech') && (
                    <View style={styles.branchContainer}>
                      <View style={styles.inputWrapper}>
                        <View style={styles.inputIconContainer}>
                          <Ionicons name="git-branch-outline" size={20} color="#3B82F6" />
                        </View>
                        <TextInput
                          label="Branch (e.g., Computer Science, Mechanical)"
                          value={formData.branch}
                          onChangeText={(value) => handleInputChange('branch', value)}
                          mode="outlined"
                          style={styles.input}
                          outlineColor="#334155"
                          activeOutlineColor="#3B82F6"
                          textColor="#FFFFFF"
                          placeholder="Enter your branch"
                          theme={{
                            colors: {
                              primary: '#3B82F6',
                              background: '#1E293B',
                              text: '#FFFFFF',
                              placeholder: '#64748B',
                            }
                          }}
                        />
                      </View>
                    </View>
                  )}
              </View>

                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                  activeOpacity={0.8}
              >
                  <View style={[styles.buttonGradient, isLoading && styles.buttonDisabled]}>
                {isLoading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.buttonText}>Creating Account...</Text>
                      </View>
                ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </View>
                )}
                  </View>
                </TouchableOpacity>

              <View style={styles.footer}>
                  <View style={styles.divider} />
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                      activeOpacity={0.7}
                  >
                      <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Surface>
            </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  background: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  patternCircle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  patternCircle2: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -80,
  },
  patternCircle3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    right: -60,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#1E293B',
    padding: 0,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#1E293B',
    paddingLeft: 48,
    fontSize: 15,
    height: 56,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingRight: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  roleCardFull: {
    width: '100%',
    marginBottom: 10,
  },
  roleCardHalf: {
    flex: 1,
  },
  roleCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    flexShrink: 1,
  },
  roleTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  courseContainer: {
    marginTop: 12,
    marginBottom: 4,
    position: 'relative',
  },
  courseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  branchContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  registerButton: {
    marginHorizontal: 28,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 28,
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '400',
  },
  loginLink: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 4,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#64748B',
  },
  dropdownSelected: {
    color: '#FFFFFF',
  },
  dropdownListWrapper: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: '#0F172A',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  dropdownItemTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
