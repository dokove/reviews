import React, { useState, useEffect, useMemo } from 'react';
import 'dokove-ui/styles.css';
import { CatalogFilterBar, type SelectOption } from 'dokove-ui';
import {
  SunIcon,
  MoonIcon,
  CoffeeIcon,
  TrophyIcon,
  WarningIcon,
  LightbulbIcon,
  FileTextIcon,
  TrashIcon,
  MessageSquareIcon,
  CloseIcon,
  XCircleIcon,
  CheckCircleIcon,
  SearchIcon,
  FlameIcon,
  StarIcon,
  ZapIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from 'dokove-icons';
import reviewsPayload from '../dist/reviews-data.json';

const scenarios = reviewsPayload.scenarios;

type ThemeMode = 'dark' | 'light' | 'sepia';
type AccentColor = 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose';
type Verdict = 'request_changes' | 'approve' | 'comment';

interface UserComment {
  id: string;
  filePath: string;
  line: number;
  text: string;
  severity: 'critical' | 'warning' | 'nitpick' | 'suggestion';
  category: string;
}

const ACCENT_MAP: Record<AccentColor, { primary: string; hover: string; soft: string; ring: string }> = {
  indigo: { primary: '#4f46e5', hover: '#4338ca', soft: '#eef2ff', ring: 'ring-indigo-500' },
  violet: { primary: '#7c3aed', hover: '#6d28d9', soft: '#f5f3ff', ring: 'ring-violet-500' },
  emerald: { primary: '#059669', hover: '#047857', soft: '#ecfdf5', ring: 'ring-emerald-500' },
  amber: { primary: '#d97706', hover: '#b45309', soft: '#fffbeb', ring: 'ring-amber-500' },
  rose: { primary: '#e11d48', hover: '#be123c', soft: '#fff1f2', ring: 'ring-rose-500' },
};

export default function App() {
  const [viewMode, setViewMode] = useState<'catalog' | 'review'>('catalog');
  const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'files' | 'conversation' | 'rubric'>('files');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [accent, setAccent] = useState<AccentColor>('indigo');

  // Filtros de Catálogo
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Categorías y Etiquetas basadas en las taxonomías del payload
  const categories = useMemo(() => {
    const set = new Set<string>();
    scenarios.forEach((s) => {
      if (s.category) {
        const clean = s.category.replace(/^review\./, '');
        set.add(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    });
    return Array.from(set).sort();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    scenarios.forEach((s) => {
      s.tags?.forEach((t: string) => {
        set.add(t.replace(/^review\./, ''));
      });
    });
    return Array.from(set).sort();
  }, []);

  const categoryOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: 'Todas las categorías' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ], [categories]);

  const seniorityOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: 'Todos los niveles' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' },
  ], []);

  const tagOptions: SelectOption[] = useMemo(() => [
    ...allTags.map((tag) => ({ value: tag, label: `#${tag}` })),
  ], [allTags]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((s) => {
      const catClean = s.category?.replace(/^review\./, '');
      const catLabel = catClean ? catClean.charAt(0).toUpperCase() + catClean.slice(1) : '';
      const cleanTags = (s.tags || []).map((t: string) => t.replace(/^review\./, ''));

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchRepo = s.repository?.toLowerCase().includes(q);
        const matchAuthor = s.author?.name?.toLowerCase().includes(q);
        const matchCat = catLabel.toLowerCase().includes(q);
        const matchTags = cleanTags.some((t: string) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchRepo && !matchAuthor && !matchCat && !matchTags) return false;
      }

      if (selectedCategory !== 'all' && catLabel !== selectedCategory) return false;
      if (selectedSeniority !== 'all' && s.seniority !== selectedSeniority) return false;
      if (selectedTags.length > 0 && !selectedTags.some((t: string) => cleanTags.includes(t))) return false;
      return true;
    });
  }, [searchQuery, selectedCategory, selectedSeniority, selectedTags]);

  // State for user review session
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [activeDraft, setActiveDraft] = useState<{
    filePath: string;
    line: number;
    text: string;
    severity: 'critical' | 'warning' | 'nitpick' | 'suggestion';
    category: string;
  } | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [userVerdict, setUserVerdict] = useState<Verdict | null>(null);
  const [verdictSummary, setVerdictSummary] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const scenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];

  // Reset session when switching scenarios
  useEffect(() => {
    setUserComments([]);
    setActiveDraft(null);
    setIsSubmitModalOpen(false);
    setUserVerdict(null);
    setVerdictSummary('');
    setIsSubmitted(false);
    setActiveTab('files');
  }, [selectedId]);

  // Handle Theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia-theme');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('sepia-theme');
    }
  }, [theme]);

  // Handle Accent styling
  useEffect(() => {
    const root = document.documentElement;
    const config = ACCENT_MAP[accent];
    root.style.setProperty('--dui-accent', config.primary);
    root.style.setProperty('--dui-accent-hover', config.hover);
    root.style.setProperty('--dui-accent-soft', config.soft);
  }, [accent]);

  // Calculate grading rubric when submitted
  const evaluateReview = () => {
    if (!scenario) return { score: 0, criticalCaught: 0, totalCritical: 0, verdictMatch: false, issuesGraded: [] };

    let score = 0;
    const allIssues = scenario.files.flatMap((f) =>
      (f.issues || []).map((iss: any) => ({ ...iss, filePath: f.path }))
    );

    const criticalIssues = allIssues.filter((i) => i.severity === 'critical' && !i.isDistractor);
    const distractors = allIssues.filter((i) => i.isDistractor);

    // 1. Check which ground truth issues were identified by candidate comments (line vicinity ±2 lines)
    const issuesGraded = allIssues.map((gt) => {
      const match = userComments.find(
        (c) => c.filePath === gt.filePath && Math.abs(c.line - gt.line) <= 2
      );
      return {
        ...gt,
        detected: Boolean(match),
        userComment: match,
      };
    });

    const criticalCaught = issuesGraded.filter((i) => i.severity === 'critical' && !i.isDistractor && i.detected).length;
    const distractorsReported = issuesGraded.filter((i) => i.isDistractor && i.detected).length;

    // Critical issue detection (up to 60 pts)
    if (criticalIssues.length > 0) {
      score += Math.round((criticalCaught / criticalIssues.length) * 60);
    } else {
      score += 60;
    }

    // Verdict accuracy (up to 25 pts)
    const verdictMatch = userVerdict === scenario.rubric.recommendedVerdict;
    if (verdictMatch) {
      score += 25;
    }

    // Distractor handling (up to 15 pts: +15 if candidate didn't falsely reject or block on distractor)
    if (distractorsReported === 0) {
      score += 15;
    } else {
      score += 5; // small penalty for falling for distractor
    }

    return {
      score: Math.min(100, score),
      criticalCaught,
      totalCritical: criticalIssues.length,
      distractorsReported,
      verdictMatch,
      issuesGraded,
    };
  };

  const scoreCard = isSubmitted ? evaluateReview() : null;

  const handleAddComment = () => {
    if (!activeDraft || !activeDraft.text.trim()) return;
    const newComment: UserComment = {
      id: 'comm-' + Date.now(),
      filePath: activeDraft.filePath,
      line: activeDraft.line,
      text: activeDraft.text.trim(),
      severity: activeDraft.severity,
      category: activeDraft.category,
    };
    setUserComments((prev) => [...prev, newComment]);
    setActiveDraft(null);
  };

  const handleDeleteComment = (commentId: string) => {
    setUserComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const totalAdditions = scenario.files.reduce((a, f) => a + f.additions, 0);
  const totalDeletions = scenario.files.reduce((a, f) => a + f.deletions, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
              D
            </span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Dokove Review
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              pub.review
            </span>
          </div>

          {viewMode === 'review' && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Volver al Catálogo</span>
              </button>

              {/* Scenario Selector */}
              <div className="hidden sm:flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Escenario:
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm rounded-md px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[280px] sm:max-w-md truncate cursor-pointer"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.seniority.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Right Controls: Theme + Accent + Finish Review Button */}
        <div className="flex items-center space-x-3">
          {/* Accent Color picker */}
          <div className="hidden sm:flex items-center space-x-1.5 p-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['indigo', 'violet', 'emerald', 'amber', 'rose'] as AccentColor[]).map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                title={`Accent: ${c}`}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  accent === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: ACCENT_MAP[c].primary }}
              />
            ))}
          </div>

          {/* Theme switcher */}
          <div className="flex items-center space-x-1 p-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'light' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Claro"
              aria-label="Modo Claro"
            >
              <SunIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'dark' ? 'bg-slate-700 text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Oscuro"
              aria-label="Modo Oscuro"
            >
              <MoonIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === 'sepia' ? 'bg-[#e6dac1] text-[#92541a] shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Sepia"
              aria-label="Modo Sepia"
            >
              <CoffeeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Finish Review Button */}
          {viewMode === 'review' && (
            !isSubmitted ? (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
              >
                <span>Finalizar Revisión</span>
                {userComments.length > 0 && (
                  <span className="bg-indigo-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {userComments.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
              >
                Reabrir Auditoría
              </button>
            )
          )}
        </div>
      </header>

      {/* ================= CONTENIDO: CATÁLOGO O REVIEW STAGE ================= */}
      {viewMode === 'catalog' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-200">
          {/* Header Compacto con Badges y Métricas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                  Seguridad & Concurrencia
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Catálogo por Cards
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Catálogo de Code Reviews
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
                Audita Pull Requests de producción, detecta vulnerabilidades críticas y entrena tu criterio técnico con rúbricas de staff.
              </p>
            </div>

            {/* Badges de Gamificación */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs font-medium">
                <FlameIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>4 Días Racha</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                <ZapIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>305 XP</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <StarIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nivel 3</span>
              </div>
            </div>
          </div>

          {/* Fila Armoniosa de Filtros Unificados con react-select */}
          <CatalogFilterBar
            theme={theme}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar en taxonomías: conceptos, temas, nodos..."
            categoryLabel="Categoría"
            selectedCategory={selectedCategory}
            categoryOptions={categoryOptions}
            onCategoryChange={setSelectedCategory}
            secondaryLabel="Seniority"
            selectedSecondary={selectedSeniority}
            secondaryOptions={seniorityOptions}
            onSecondaryChange={setSelectedSeniority}
            tagLabel="Etiquetas"
            selectedTags={selectedTags}
            tagOptions={tagOptions}
            onTagsChange={setSelectedTags}
            totalFiltered={filteredScenarios.length}
            itemNounSingle="escenario"
            itemNounPlural="escenarios"
            onClearFilters={() => {
              setSelectedCategory('all');
              setSelectedSeniority('all');
              setSelectedTags([]);
              setSearchQuery('');
            }}
          />

          {/* Sección de Cards y Contador */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Pull Requests Disponibles
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {filteredScenarios.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona cualquier escenario para inspeccionar el diff, dejar notas en línea y emitir tu veredicto.
                </p>
              </div>

              {scenario && (
                <button
                  type="button"
                  onClick={() => setViewMode('review')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir PR activo ({scenario.title.split(':')[0]})</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grid de Cards */}
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <SearchIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No se encontraron Pull Requests
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Intenta cambiar los filtros de categoría, nivel o búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredScenarios.map((s) => {
                  const isSelected = s.id === selectedId;
                  const catClean = s.category?.replace(/^review\./, '') || 'general';
                  const catLabel = catClean.charAt(0).toUpperCase() + catClean.slice(1);
                  const cleanTags = (s.tags || []).map((t: string) => t.replace(/^review\./, ''));
                  const filesCount = s.files?.length || 1;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedId(s.id);
                        setViewMode('review');
                      }}
                      className={`group relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between cursor-pointer bg-white dark:bg-slate-900 hover:shadow-lg ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            <span>~</span>
                            <span>{catLabel}</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {s.seniority}
                          </span>
                        </div>

                        {/* Repo y Branch */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>{s.repository}</span>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">PR #{s.prNumber}</span>
                        </div>

                        {/* Título */}
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                            {s.title}
                          </h3>
                        </div>

                        {/* Autor */}
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                            {s.author?.name ? s.author.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate text-[11px]">
                              {s.author?.name || 'Autor'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate -mt-0.5">
                              {s.author?.role || 'Developer'}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {cleanTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {cleanTags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2.5 font-medium text-[11px]">
                          <span className="flex items-center gap-1">
                            <FileTextIcon className="w-3.5 h-3.5 text-slate-400" />
                            {filesCount} {filesCount === 1 ? 'archivo' : 'archivos'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            {s.estimatedMinutes} min
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <ZapIcon className="w-3.5 h-3.5" />
                            +150 XP
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform text-xs">
                          Revisar PR
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* PR Header Banner */}
          <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <span>{scenario.repository}</span>
                <span>•</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                  {scenario.branch.target}
                </span>
                <span>←</span>
                <span className="font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px]">
                  {scenario.branch.source}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {scenario.title}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Open
                </span>
              </h1>
            </div>

            {/* Author Card & Seniority */}
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-2 rounded-lg">
              <img
                src={scenario.author.avatar}
                alt={scenario.author.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {scenario.author.name} <span className="text-slate-400 font-normal">(@{scenario.author.username})</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">{scenario.author.role}</div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                {scenario.seniority}
              </span>
            </div>
          </div>

          {/* PR Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pt-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('files')}
              className={`pb-2.5 px-3 border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'files'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Files Changed</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {scenario.files.length}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-normal">
                +{totalAdditions}
              </span>
              <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-normal">
                -{totalDeletions}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('conversation')}
              className={`pb-2.5 px-3 border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'conversation'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Conversation</span>
            </button>

            <button
              onClick={() => setActiveTab('rubric')}
              className={`pb-2.5 px-3 border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'rubric'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Rúbrica & Ground Truth</span>
              {isSubmitted && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                  {scoreCard?.score}/100
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* Scorecard Hero Alert if Submitted */}
        {isSubmitted && scoreCard && (
          <div className="mb-8 p-6 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                    {scoreCard.score >= scenario.rubric.passingScore ? (
                      <TrophyIcon className="w-5 h-5 text-amber-500" />
                    ) : (
                      <WarningIcon className="w-5 h-5 text-amber-500" />
                    )}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {scoreCard.score >= scenario.rubric.passingScore
                      ? '¡Auditoría Aprobada con Éxito!'
                      : 'Auditoría Finalizada — Requiere Calibración'}
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  {scenario.rubric.summary}
                </p>
              </div>

              <div className="flex items-center space-x-6 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {scoreCard.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Puntaje Final</div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {scoreCard.criticalCaught} / {scoreCard.totalCritical}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Críticos Detectados</div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {scoreCard.verdictMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Correcto</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">Incorrecto</span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Veredicto</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: FILES CHANGED (Interactive Diff Viewer) */}
        {activeTab === 'files' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-1.5">
                <LightbulbIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Haz click en el botón <strong className="text-indigo-600 dark:text-indigo-400 font-mono">+</strong> al
                  lado de cualquier línea para dejar un comentario técnico o advertir de un bug.
                </span>
              </p>
              <span>{userComments.length} comentarios registrados</span>
            </div>

            {scenario.files.map((file, fileIdx) => (
              <div
                key={file.path}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
              >
                {/* File Header */}
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold">
                    <FileTextIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{file.path}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase font-sans">
                      {file.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                    <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                  </div>
                </div>

                {/* Diff Lines Table */}
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full border-collapse">
                    <tbody>
                      {file.diffLines.map((line, lineIdx) => {
                        const isAdd = line.type === 'add';
                        const isDel = line.type === 'del';
                        const activeLineNumber = line.newLineNumber || line.oldLineNumber || lineIdx + 1;

                        // Check if comments exist for this line
                        const commentsOnThisLine = userComments.filter(
                          (c) => c.filePath === file.path && c.line === activeLineNumber
                        );

                        // Check if draft is active on this line
                        const isDraftOnThisLine =
                          activeDraft?.filePath === file.path && activeDraft?.line === activeLineNumber;

                        return (
                          <React.Fragment key={lineIdx}>
                            <tr
                              className={`group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                                isAdd
                                  ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
                                  : isDel
                                  ? 'bg-rose-500/10 text-rose-950 dark:text-rose-200'
                                  : 'text-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {/* Old Line Number */}
                              <td className="w-10 text-right pr-2 py-0.5 select-none text-slate-400 dark:text-slate-600 border-r border-slate-200 dark:border-slate-800 text-[11px]">
                                {line.oldLineNumber || ''}
                              </td>

                              {/* New Line Number + Comment trigger (+) */}
                              <td className="w-12 text-right pr-2 py-0.5 select-none text-slate-400 dark:text-slate-600 border-r border-slate-200 dark:border-slate-800 text-[11px] relative">
                                <span className="group-hover:hidden">{line.newLineNumber || ''}</span>
                                <button
                                  onClick={() =>
                                    setActiveDraft({
                                      filePath: file.path,
                                      line: activeLineNumber,
                                      text: '',
                                      severity: 'critical',
                                      category: 'security',
                                    })
                                  }
                                  className="hidden group-hover:inline-flex absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded items-center justify-center font-bold text-[11px] shadow"
                                  title="Añadir comentario de review en esta línea"
                                >
                                  +
                                </button>
                              </td>

                              {/* Line Content */}
                              <td className="px-3 py-0.5 whitespace-pre">
                                <span className="select-none inline-block w-4 text-slate-400">
                                  {isAdd ? '+' : isDel ? '-' : ' '}
                                </span>
                                {line.content}
                              </td>
                            </tr>

                            {/* Render Inline Comments Already Added */}
                            {commentsOnThisLine.map((c) => (
                              <tr key={c.id} className="bg-indigo-50/50 dark:bg-slate-900 border-y border-indigo-200 dark:border-indigo-900/50">
                                <td colSpan={3} className="px-6 py-3 font-sans">
                                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                          Tú (Reviewer)
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                            c.severity === 'critical'
                                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                              : c.severity === 'warning'
                                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                          }`}
                                        >
                                          {c.severity}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-500">
                                          Categoría: {c.category}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="text-xs text-slate-400 hover:text-rose-500 transition p-1 rounded"
                                        title="Eliminar comentario"
                                        aria-label="Eliminar comentario"
                                      >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                      {c.text}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* Render Active Comment Draft Box */}
                            {isDraftOnThisLine && (
                              <tr className="bg-indigo-50/70 dark:bg-slate-900 border-y border-indigo-300 dark:border-indigo-800">
                                <td colSpan={3} className="px-6 py-4 font-sans">
                                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-indigo-300 dark:border-indigo-700 shadow-md max-w-3xl space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                        <MessageSquareIcon className="w-3.5 h-3.5 text-indigo-500" />
                                        Dejar comentario en línea {activeDraft.line}
                                      </span>
                                      <div className="flex items-center space-x-2 text-xs">
                                        <label className="text-slate-500">Severidad:</label>
                                        <select
                                          value={activeDraft.severity}
                                          onChange={(e) =>
                                            setActiveDraft({ ...activeDraft, severity: e.target.value as any })
                                          }
                                          className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                                        >
                                          <option value="critical">Crítico (Bloqueante)</option>
                                          <option value="warning">Advertencia</option>
                                          <option value="nitpick">Nitpick / Cosmético</option>
                                          <option value="suggestion">Sugerencia</option>
                                        </select>
                                      </div>
                                    </div>

                                    <textarea
                                      value={activeDraft.text}
                                      onChange={(e) => setActiveDraft({ ...activeDraft, text: e.target.value })}
                                      placeholder="Escribe tu observación técnica, riesgo detectado o sugerencia de corrección..."
                                      rows={3}
                                      autoFocus
                                      className="w-full text-xs sm:text-sm p-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                                    />

                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => setActiveDraft(null)}
                                        className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleAddComment}
                                        disabled={!activeDraft.text.trim()}
                                        className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow"
                                      >
                                        Añadir Comentario
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: CONVERSATION (PR Description) */}
        {activeTab === 'conversation' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <img
                  src={scenario.author.avatar}
                  alt={scenario.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {scenario.author.name} <span className="font-normal text-slate-400">comentó:</span>
                  </div>
                  <div className="text-xs text-slate-500">Hace 2 horas • {scenario.author.role}</div>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {scenario.description}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <FileTextIcon className="w-3.5 h-3.5" />
                Instrucciones de Auditoría:
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>Examina la pestaña <strong>Files Changed</strong> para inspeccionar el diff unificado.</li>
                <li>Haz clic en <strong>+</strong> en cualquier línea para redactar observaciones técnicas.</li>
                <li>Identifica riesgos de seguridad, fugas de memoria y condiciones de carrera.</li>
                <li>Cuidado con los <em>distractores</em> (cambios de estilo o refactors válidos que no deben bloquear el PR).</li>
                <li>Cuando termines, pulsa <strong>Finalizar Revisión</strong> para emitir tu veredicto.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: RUBRIC & GROUND TRUTH (Evaluation Details) */}
        {activeTab === 'rubric' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Rúbrica Oficial de Evaluación Técnica
                  </h2>
                  <p className="text-xs text-slate-500">
                    Estándares esperados para aprobar la auditoría de este PR.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-slate-400">Veredicto Esperado:</span>
                  <div className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase">
                    {scenario.rubric.recommendedVerdict.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {scenario.rubric.totalCritical}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Fallos Críticos</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {scenario.rubric.totalWarnings}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Advertencias</div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-black text-slate-600 dark:text-slate-400">
                    {scenario.rubric.totalDistractors}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Distractores</div>
                </div>
              </div>
            </div>

            {/* List of Ground Truth Issues */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Defectos Reales en el Diff (Ground Truth)
              </h3>

              {scenario.files.map((f) => (
                <div key={f.path} className="space-y-3">
                  {(f.issues || []).map((iss) => (
                    <div
                      key={iss.id}
                      className={`p-5 rounded-lg border bg-white dark:bg-slate-900 shadow-sm ${
                        iss.isDistractor
                          ? 'border-slate-300 dark:border-slate-700'
                          : iss.severity === 'critical'
                          ? 'border-rose-300 dark:border-rose-900/60'
                          : 'border-amber-300 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              iss.isDistractor
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                : iss.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {iss.isDistractor ? 'DISTRACTOR' : iss.severity}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {iss.title}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {f.path}:{iss.line}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3">
                        {iss.explanation}
                      </p>

                      {iss.suggestedFix && (
                        <div className="mt-3 bg-slate-950 text-slate-100 p-3 rounded font-mono text-xs overflow-x-auto border border-slate-800">
                          <div className="text-[10px] text-slate-400 mb-1 font-sans uppercase font-bold flex items-center gap-1">
                            <LightbulbIcon className="w-3.5 h-3.5 text-amber-400" />
                            Corrección Sugerida:
                          </div>
                          <pre className="text-emerald-400">{iss.suggestedFix}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
        </div>
      )}

      {/* Review Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Emitir Veredicto de Pull Request
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded inline-flex items-center"
                aria-label="Cerrar modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Selecciona tu Veredicto Final:
              </label>

              <div className="space-y-2">
                <label
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition ${
                    userVerdict === 'request_changes'
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value="request_changes"
                    checked={userVerdict === 'request_changes'}
                    onChange={() => setUserVerdict('request_changes')}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircleIcon className="w-4 h-4" />
                      Solicitar Cambios (Request Changes)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Bloquea la fusión del PR debido a fallos críticos de seguridad, fugas o concurrencia.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition ${
                    userVerdict === 'comment'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value="comment"
                    checked={userVerdict === 'comment'}
                    onChange={() => setUserVerdict('comment')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <MessageSquareIcon className="w-4 h-4" />
                      Dejar Comentario General (Comment)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Envía feedback constructivo sin bloquear ni aprobar explícitamente la PR.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition ${
                    userVerdict === 'approve'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value="approve"
                    checked={userVerdict === 'approve'}
                    onChange={() => setUserVerdict('approve')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircleIcon className="w-4 h-4" />
                      Aprobar (Approve)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Autoriza el merge en producción. Solo debe usarse si no hay defectos críticos.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Resumen de Revisión para el Autor (Opcional):
              </label>
              <textarea
                value={verdictSummary}
                onChange={(e) => setVerdictSummary(e.target.value)}
                placeholder="Hola @carlos-r, he revisado los cambios y he dejado observaciones sobre..."
                rows={3}
                className="w-full text-xs p-3 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Volver al Diff
              </button>
              <button
                onClick={() => {
                  if (!userVerdict) return;
                  setIsSubmitModalOpen(false);
                  setIsSubmitted(true);
                  setActiveTab('rubric');
                }}
                disabled={!userVerdict}
                className="px-5 py-2 rounded text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow"
              >
                Confirmar y Evaluar ({userComments.length} comentarios)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
