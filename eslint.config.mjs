
export default [
  {
    ignores: ["**/node_modules/**", ".next/**", "dist/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {},
    rules: {},
  },
];
