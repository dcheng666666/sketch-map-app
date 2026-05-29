import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PreviewApp } from "./PreviewApp";
import "./preview.css";

const container = document.getElementById("preview-root");
if (!container) throw new Error("#preview-root not found");

createRoot(container).render(
  <StrictMode>
    <PreviewApp />
  </StrictMode>,
);
