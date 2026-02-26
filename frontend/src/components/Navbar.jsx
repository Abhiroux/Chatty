import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { LogOut, MessageSquare, Settings, User, Users } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  return (
    <>
      <header className="fixed w-full top-0 z-40 bg-white/70 dark:bg-[#16152a]/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="flex items-center gap-2.5 hover:opacity-80 transition-all group"
              >
                <div className="size-9 rounded-xl bg-[#6764f2]/10 dark:bg-[#6764f2]/20 flex items-center justify-center group-hover:bg-[#6764f2]/20 dark:group-hover:bg-[#6764f2]/30 transition-colors">
                  <MessageSquare className="size-5 text-[#6764f2]" />
                </div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Chatty</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={"/settings"}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}
              >
                <Settings className="size-5" />
                <span className="hidden sm:inline font-medium text-sm">Settings</span>
              </Link>

              {authUser && (
                <>
                  <Link to={"/connections"} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}>
                    <Users className="size-5" />
                    <span className="hidden sm:inline font-medium text-sm">Connections</span>
                  </Link>
                  <Link to={"/profile"} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}>
                    <User className="size-5" />
                    <span className="hidden sm:inline font-medium text-sm">Profile</span>
                  </Link>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors" onClick={logout}>
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline font-medium text-sm">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
