import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MotionConfigProvider } from "@/contexts/MotionConfigContext";
import { useCursorVisibility } from "@/hooks/useCursorVisibility";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

/**
 * App shell content with cursor visibility management.
 * Cursor ownership is at app shell level for consistent behavior across routes.
 */
const AppContent = () => {
  // App shell level - ensures cursor state is consistent across all routes
  useCursorVisibility();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <MotionConfigProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </MotionConfigProvider>
  </ThemeProvider>
);

export default App;
