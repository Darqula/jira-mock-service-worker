// Declarations for side-effect-only stylesheet imports. TypeScript 6+
// reports TS2882 for unresolvable side-effect imports, and CSS files have
// no type declarations to resolve.
declare module '*.css';
