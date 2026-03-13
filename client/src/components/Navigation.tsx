import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export function Navigation() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user } = useAuth();

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

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663346956907/zvKZAvPjOrLorAIn.png"
              alt="Print Cartel Logo"
              className="h-8 sm:h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation("/")}
            />
            <div
              className="text-lg sm:text-xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation("/")}
            >
              Print Cartel
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="flex gap-1 sm:gap-2 items-center">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/reseller")}
              className="text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
            >
              For Resellers
            </Button>
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/track")}
                  className="text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
                >
                  Track Order
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/dashboard")}
                  className="text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
                >
                  My Account
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation("/admin")}
                    className="text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  onClick={() => handleNavigation("/order")}
                  className="text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 py-2"
                >
                  Order Now
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 py-2"
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
              className="h-6 sm:h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation("/")}
            />
            <div
              className="text-base sm:text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation("/")}
            >
              Print Cartel
            </div>
          </div>

          {/* Hamburger Menu */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              className="w-full justify-start text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
            >
              For Resellers
            </Button>

            {/* Track Order */}
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/track")}
              className="w-full justify-start text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
            >
              Track Order
            </Button>

            {/* My Account */}
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/dashboard")}
              className="w-full justify-start text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
            >
              My Account
            </Button>

            {/* Admin */}
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/admin")}
                className="w-full justify-start text-sm text-foreground hover:bg-gray-100 font-semibold px-4 py-2"
              >
                Admin
              </Button>
            )}

            {/* Order Now */}
            <Button
              onClick={() => handleNavigation("/order")}
              className="w-full justify-start text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-4 py-2"
            >
              Order Now
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
