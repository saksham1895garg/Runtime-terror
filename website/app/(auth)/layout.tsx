import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          DHARA-SOOCHAK
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Landslide Risk Assessment & Early Warning System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          {children}
        </div>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          <Link href="/public" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            ← Return to Public Map
          </Link>
        </div>
      </div>
    </div>
  );
}
