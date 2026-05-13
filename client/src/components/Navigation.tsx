import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, ChevronDown, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useUnreadChatCount } from "@/hooks/useUnreadChatCount";

export function Navigation() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user } = useAuth();
  const unreadChatCount = useUnreadChatCount();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const trackAndNavigate = (label: string, path: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'Navigation',
        event_label: label,
      });
    }
    handleNavigation(path);
  };

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/zvKZAvPjOrLorAIn.png"
              alt="Print Cartel Logo"
              className="h-8 sm:h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => handleNavigation("/")}
            />
            <div
              className="text-lg sm:text-xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => handleNavigation("/")}
            >
              Print Cartel
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="flex gap-2 sm:gap-3 items-center">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/reseller")}
              className="text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 transition-colors duration-200"
            >
              For Resellers
            </Button>
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/dashboard")}
                  className="text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 relative transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  My Account
                  {unreadChatCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0 font-bold">
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </Badge>
                  )}
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation("/admin")}
                    className="text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 transition-colors duration-200"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  onClick={() => trackAndNavigate('Nav – Order Now (Desktop)', '/order')}
                  className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md font-semibold px-6 py-2 transition-all duration-200"
                >
                  Order Now
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md font-semibold px-6 py-2 transition-all duration-200"
              >
                Login / Register
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/zvKZAvPjOrLorAIn.png"
              alt="Print Cartel Logo"
              className="h-6 sm:h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => handleNavigation("/")}
            />
            <div
              className="text-base sm:text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => handleNavigation("/")}
            >
              Print Cartel
            </div>
          </div>

          {/* Hamburger Menu */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-secondary rounded-lg transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 space-y-2">
            {/* For Resellers */}
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/reseller")}
              className="w-full justify-start text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 transition-colors duration-200"
            >
              For Resellers
            </Button>

            {/* My Account */}
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/dashboard")}
              className="w-full justify-start text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 relative transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              My Account
              {unreadChatCount > 0 && (
                <Badge className="absolute right-4 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0 font-bold">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </Badge>
              )}
            </Button>

            {/* Admin */}
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/admin")}
                className="w-full justify-start text-sm text-foreground hover:bg-secondary hover:text-foreground font-semibold px-4 py-2 transition-colors duration-200"
              >
                Admin
              </Button>
            )}

            {/* Order Now */}
            <Button
              onClick={() => trackAndNavigate('Nav – Order Now (Mobile)', '/order')}
              className="w-full justify-start text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md font-semibold px-4 py-2 transition-all duration-200"
            >
              Order Now
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
