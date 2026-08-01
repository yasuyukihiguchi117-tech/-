import React from "react";
import ReactDOM from "react-dom/client";
import AccessGate from "./AccessGate.jsx";
import PaidNoteGenerator from "./PaidNoteGenerator.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AccessGate>
      {({ apiKey, resetApiKey }) => (
        <PaidNoteGenerator apiKey={apiKey} onResetApiKey={resetApiKey} />
      )}
    </AccessGate>
  </React.StrictMode>
);
