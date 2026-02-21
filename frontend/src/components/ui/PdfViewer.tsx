/**
 * PdfViewer.tsx
 * ─────────────
 * Custom in-app PDF viewer — canvas-based, no iframe, no CSP issues.
 * • Fetches PDF as ArrayBuffer with Bearer token → no auth issues
 * • Renders ALL pages vertically so scrolling = next page (Google Docs style)
 * • Centers content within the visible area (right of sidebar)
 * • Header-bar with zoom, download, page counter, and close
 */
import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { ZoomIn, ZoomOut, Download, X, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PdfViewerProps {
    url: string;
    token?: string;
    onClose: () => void;
    filename?: string;
    /** Pixel width of sidebar — viewer will offset by this amount so it centres within the content area */
    sidebarWidth?: number;
}

/** Renders a single PDF page onto a <canvas> */
function PdfPage({
    doc,
    pageNum,
    scale,
}: {
    doc: PDFDocumentProxy;
    pageNum: number;
    scale: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderRef = useRef<any>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (renderRef.current) {
                try { renderRef.current.cancel(); } catch { /* ignore */ }
            }
            const page = await doc.getPage(pageNum);
            if (cancelled) { page.cleanup(); return; }

            const vp = page.getViewport({ scale });
            const canvas = canvasRef.current;
            if (!canvas) { page.cleanup(); return; }

            canvas.width = vp.width;
            canvas.height = vp.height;

            const ctx = canvas.getContext('2d')!;
            const task = page.render({ canvasContext: ctx, viewport: vp, canvas });
            renderRef.current = task;

            try {
                await task.promise;
            } catch (e: any) {
                if (e?.name !== 'RenderingCancelledException') console.error('Render error', e);
            } finally {
                page.cleanup();
            }
        })();

        return () => { cancelled = true; };
    }, [doc, pageNum, scale]);

    return (
        <div className="flex justify-center">
            <div
                className="relative shadow-2xl rounded-lg overflow-hidden"
                style={{ marginBottom: 24, background: '#fff' }}
            >
                {/* Page number watermark */}
                <div className="absolute top-2 right-3 text-[11px] text-gray-400 select-none z-10">
                    {pageNum}
                </div>
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
            </div>
        </div>
    );
}

export function PdfViewer({
    url,
    token,
    onClose,
    filename = 'document.pdf',
    sidebarWidth = 320,
}: PdfViewerProps) {
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visiblePage, setVisiblePage] = useState(1);
    const scrollRef = useRef<HTMLDivElement>(null);

    /* ── Detect content area rect from DOM (accounts for header + sidebar) */
    const [contentRect, setContentRect] = useState({ top: 0, left: sidebarWidth });
    useEffect(() => {
        const measure = () => {
            // #main-content is the <main> element — its bounding rect tells us exactly
            // where the content area starts (below the header, right of the sidebar).
            const main = document.querySelector('#main-content') as HTMLElement | null;
            if (main) {
                const rect = main.getBoundingClientRect();
                setContentRect({ top: Math.round(rect.top), left: Math.round(rect.left) });
                return;
            }
            // Fallback: read sidebar width from [data-sidebar]
            const sidebar = document.querySelector('[data-sidebar]') as HTMLElement | null;
            setContentRect({
                top: 60, // approximate header height
                left: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : sidebarWidth,
            });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [sidebarWidth]);

    /* ── Load PDF ──────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(url, { headers });
                if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);
                const buf = await res.arrayBuffer();
                if (cancelled) return;
                const doc = await pdfjsLib.getDocument({ data: buf }).promise;
                if (cancelled) return;
                setPdfDoc(doc);
                setTotalPages(doc.numPages);
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Failed to load PDF');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [url, token]);

    /* ── Track which page is visible while scrolling ──── */
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const onScroll = () => {
            const children = Array.from(container.querySelectorAll<HTMLElement>('[data-page]'));
            for (const el of children) {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 || rect.bottom > window.innerHeight / 2) {
                    const p = parseInt(el.dataset.page || '1', 10);
                    setVisiblePage(p);
                    break;
                }
            }
        };
        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, [totalPages]);

    /* ── Keyboard shortcuts ────────────────────────────── */
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || (e.key === '=' && e.ctrlKey)) { e.preventDefault(); setScale(s => Math.min(s + 0.2, 3)); }
            if (e.key === '-' && e.ctrlKey) { e.preventDefault(); setScale(s => Math.max(s - 0.2, 0.5)); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    /* ── Download ──────────────────────────────────────── */
    const handleDownload = async () => {
        try {
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(url, { headers });
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch { /* silent */ }
    };

    /* ── UI ────────────────────────────────────────────── */
    return (
        <div
            className="fixed bottom-0 right-0 z-[9999] flex flex-col"
            style={{ left: contentRect.left, top: contentRect.top, background: '#0d1117' }}
        >
            {/* ── Toolbar ─────────────────────────────────── */}
            <div
                className="shrink-0 flex items-center justify-between gap-4 px-5 py-2.5 text-white border-b border-white/10"
                style={{ background: '#161b22' }}
            >
                {/* Back to Assignments */}
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium transition shrink-0"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Assignments
                </button>

                {/* Filename */}
                <span className="text-sm font-semibold text-gray-200 truncate min-w-0 max-w-[40%]" title={filename}>
                    📄 {filename}
                </span>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Page counter */}
                    {totalPages > 0 && (
                        <span className="text-xs text-gray-400 bg-white/10 px-2.5 py-1 rounded-full">
                            {visiblePage} / {totalPages}
                        </span>
                    )}

                    <div className="w-px h-4 bg-white/15" />

                    {/* Zoom */}
                    <button
                        onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
                        title="Zoom out (Ctrl-)"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 w-10 text-center">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale(s => Math.min(s + 0.2, 3))}
                        title="Zoom in (Ctrl+)"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-white/15" />

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        title="Download"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>

                    {/* Close — large labelled button so it's easy to find */}
                    <button
                        onClick={onClose}
                        title="Close viewer (Esc)"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </button>
                </div>
            </div>

            {/* ── Scroll area — ALL pages rendered vertically ── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, #1c2333 0%, #0d1117 70%)',
                    paddingTop: 28,
                    paddingBottom: 48,
                }}
            >
                {loading && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
                        <span className="text-sm">Loading PDF…</span>
                    </div>
                )}

                {error && (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-red-400">
                        <AlertCircle className="w-12 h-12" />
                        <span className="text-sm font-medium">{error}</span>
                        <button
                            onClick={onClose}
                            className="mt-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-sm transition"
                        >
                            Close
                        </button>
                    </div>
                )}

                {!loading && !error && pdfDoc &&
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <div key={pageNum} data-page={pageNum} style={{ paddingLeft: 24, paddingRight: 24 }}>
                            <PdfPage doc={pdfDoc} pageNum={pageNum} scale={scale} />
                        </div>
                    ))
                }
            </div>

            {/* ── Thin progress bar ───────────────────────── */}
            {totalPages > 0 && (
                <div className="h-1 bg-white/5 shrink-0">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                        style={{ width: `${(visiblePage / totalPages) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
