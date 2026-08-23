/**
 * LeetCode Java Autocomplete
 * Runs in MAIN world (manifest "world": "MAIN") so window.monaco is accessible.
 */

// ─── Java Data ──────────────────────────────────────────────────────────────

const JAVA_KEYWORDS = [
  'abstract','assert','boolean','break','byte','case','catch','char','class',
  'const','continue','default','do','double','else','enum','extends','final',
  'finally','float','for','goto','if','implements','import','instanceof','int',
  'interface','long','native','new','package','private','protected','public',
  'return','short','static','strictfp','super','switch','synchronized','this',
  'throw','throws','transient','try','void','volatile','while','var','record',
  'sealed','permits','yield','null','true','false'
];

const JAVA_TYPES = [
  'String','Integer','Long','Double','Float','Boolean','Character','Byte','Short',
  'Object','Class','ArrayList','LinkedList','HashMap','HashSet','TreeMap','TreeSet',
  'LinkedHashMap','LinkedHashSet','Stack','Queue','Deque','ArrayDeque','PriorityQueue',
  'Collections','Arrays','Math','System','StringBuilder','StringBuffer',
  'List','Map','Set','Collection','Comparable','Comparator','Optional',
  'NullPointerException','IllegalArgumentException','RuntimeException','Exception'
];

const JAVA_SNIPPETS = [
  { label:'sout',     insert:'System.out.println()',         detail:'print to stdout' },
  { label:'soutf',    insert:'System.out.printf("")',        detail:'printf' },
  { label:'fori',     insert:'for (int i = 0; i < n; i++)', detail:'for i loop' },
  { label:'forj',     insert:'for (int j = 0; j < n; j++)', detail:'for j loop' },
  { label:'foreach',  insert:'for ( : )',                    detail:'enhanced for' },
  { label:'while',    insert:'while ()',                     detail:'while loop' },
  { label:'tryc',     insert:'try { } catch (Exception e) { e.printStackTrace(); }', detail:'try-catch' },
  { label:'iff',      insert:'if ()',                        detail:'if block' },
  { label:'ifel',     insert:'if () { } else { }',          detail:'if-else' },
  { label:'newlist',  insert:'new ArrayList<>()',            detail:'new ArrayList' },
  { label:'newmap',   insert:'new HashMap<>()',              detail:'new HashMap' },
  { label:'newset',   insert:'new HashSet<>()',              detail:'new HashSet' },
  { label:'newpq',    insert:'new PriorityQueue<>()',        detail:'min-heap' },
  { label:'newpqr',   insert:'new PriorityQueue<>((a,b)->b-a)', detail:'max-heap' },
  { label:'newstack', insert:'new ArrayDeque<>()',           detail:'stack/deque' },
  { label:'arrsort',  insert:'Arrays.sort(arr)',             detail:'sort array' },
  { label:'arrfill',  insert:'Arrays.fill(arr, 0)',          detail:'fill array' },
  { label:'intmax',   insert:'Integer.MAX_VALUE',            detail:'max int' },
  { label:'intmin',   insert:'Integer.MIN_VALUE',            detail:'min int' },
  { label:'sb',       insert:'new StringBuilder()',          detail:'StringBuilder' },
  { label:'mapget',   insert:'.getOrDefault(key, 0)',        detail:'getOrDefault' },
  { label:'mapput',   insert:'.put(key, val)',               detail:'map.put' },
  { label:'mapcon',   insert:'.containsKey(key)',            detail:'containsKey' },
  { label:'toint',    insert:'Integer.parseInt()',           detail:'string to int' },
  { label:'tostr',    insert:'String.valueOf()',             detail:'to string' },
  { label:'tocharr',  insert:'.toCharArray()',               detail:'to char array' },
];

const JAVA_METHODS = [
  'length','size','get','set','add','remove','contains','isEmpty','clear',
  'charAt','substring','indexOf','lastIndexOf','startsWith','endsWith',
  'toLowerCase','toUpperCase','trim','replace','replaceAll','split',
  'getOrDefault','putIfAbsent','computeIfAbsent','entrySet','keySet','values',
  'sort','reverse','min','max','abs','pow','sqrt','parseInt','parseDouble',
  'valueOf','append','insert','delete','toString','peek','poll','offer',
  'push','pop','addFirst','addLast','removeFirst','removeLast',
  'containsKey','containsValue','put','forEach','toCharArray','equals',
  'compareTo','hashCode','clone','stream','filter','map','collect',
];

// ─── Suggestion Engine ──────────────────────────────────────────────────────

function extractSymbols(code) {
  const symbols = new Set();
  const patterns = [
    /(?:int|long|double|float|boolean|char|byte|short|String|var)\s+(\w+)/g,
    /\b([a-z][a-zA-Z0-9]{2,})\b/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(code)) !== null) {
      if (!JAVA_KEYWORDS.includes(m[1])) symbols.add(m[1]);
    }
  }
  return [...symbols];
}

function getSuggestions(word, codeSymbols) {
  if (!word || word.length < 2) return [];
  const lower = word.toLowerCase();
  const seen = new Set();
  const results = [];

  const push = (item) => {
    if (!seen.has(item.label)) { seen.add(item.label); results.push(item); }
  };

  for (const s of JAVA_SNIPPETS) {
    if (s.label.startsWith(lower)) push({ ...s, kind: 'snippet' });
  }
  for (const v of codeSymbols) {
    if (v.toLowerCase().startsWith(lower) && v !== word) push({ label:v, insert:v, kind:'variable', detail:'local' });
  }
  for (const k of JAVA_KEYWORDS) {
    if (k.startsWith(lower)) push({ label:k, insert:k, kind:'keyword', detail:'keyword' });
  }
  for (const t of JAVA_TYPES) {
    if (t.toLowerCase().startsWith(lower)) push({ label:t, insert:t, kind:'type', detail:'type' });
  }
  for (const m of JAVA_METHODS) {
    if (m.startsWith(lower)) push({ label:m, insert:m+'()', kind:'method', detail:'method' });
  }

  return results.slice(0, 12);
}

// ─── Monaco Setup (direct, since we're in MAIN world) ───────────────────────

let monacoRegistered = false;

function setupMonaco() {
  const monaco = window.monaco;
  if (!monaco || !monaco.languages) return false;
  if (monacoRegistered) return true;

  try {
    monaco.languages.registerCompletionItemProvider('java', {
      triggerCharacters: [],
      provideCompletionItems(model, position) {
        const code = model.getValue();
        const wordInfo = model.getWordUntilPosition(position);
        const word = wordInfo.word;
        if (!word || word.length < 2) return { suggestions: [] };

        const symbols = extractSymbols(code);
        const suggs = getSuggestions(word, symbols);
        const CIK = monaco.languages.CompletionItemKind;
        const kindMap = {
          keyword: CIK.Keyword, type: CIK.Class,
          method: CIK.Method, snippet: CIK.Snippet, variable: CIK.Variable
        };
        const sortPriority = { snippet:'0', variable:'1', keyword:'2', type:'3', method:'4' };

        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn, endColumn: wordInfo.endColumn,
        };

        return {
          suggestions: suggs.map(s => ({
            label: { label: s.label, detail: '  ' + s.detail },
            kind: kindMap[s.kind] ?? CIK.Text,
            insertText: s.insert,
            range,
            sortText: (sortPriority[s.kind] || '5') + s.label,
          }))
        };
      }
    });

    monacoRegistered = true;
    console.log('[LC-AC] ✓ Java completions registered');
    return true;
  } catch(e) {
    console.warn('[LC-AC] setup error:', e);
    return false;
  }
}

function trySetup(attempt) {
  attempt = attempt || 0;
  if (monacoRegistered) return;

  if (window.monaco && window.monaco.languages) {
    setupMonaco();
    return;
  }

  if (attempt < 50) {
    setTimeout(() => trySetup(attempt + 1), 200 + attempt * 30);
  } else {
    console.warn('[LC-AC] Monaco not found after 50 attempts');
  }
}

// ─── SPA navigation (LeetCode is a React SPA) ───────────────────────────────

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    monacoRegistered = false;
    setTimeout(() => trySetup(0), 500);
  }
}).observe(document.body, { childList: true, subtree: true });

// ─── Boot ────────────────────────────────────────────────────────────────────

trySetup(0);
