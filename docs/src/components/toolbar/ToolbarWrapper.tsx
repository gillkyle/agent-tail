"use client";

import { ToolbarProvider } from "./ToolbarContext";
import { Toolbar } from "./Toolbar";

export function ToolbarWrapper() {
  return (
    <ToolbarProvider>
      <Toolbar />
    </ToolbarProvider>
  );
}
