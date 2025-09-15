import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, LogIn, BookOpen, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  institution: z.string().min(1, "Institution is required"),
  role: z.enum(["instructor", "student"]),
});

type SigninForm = z.infer<typeof signinSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface SigninProps {
  onSignin: (sessionId: string, faculty: any) => void;
}

export default function Signin({ onSignin }: SigninProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const signinForm = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      title: "",
      department: "",
      institution: "",
      role: "instructor",
    },
  });

  const handleSignin = async (data: SigninForm) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest("/api/auth/login", "POST", data) as any;
      
      // Store session in localStorage
      localStorage.setItem("sessionId", response.sessionId);
      localStorage.setItem("faculty", JSON.stringify(response.faculty));
      
      onSignin(response.sessionId, response.faculty);
    } catch (error: any) {
      setError(error.message || "Sign in failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest("/api/auth/register", "POST", data) as any;
      setSuccess(response.message || "Registration successful! Please wait for admin approval.");
      registerForm.reset();
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">PBL Toolkit</h1>
          </div>
          <p className="text-gray-600">
            Pivot-and-Launch Project-Based Learning Platform
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isRegistering ? "Create Account" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {isRegistering ? (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Daniel Treku"
                      {...registerForm.register("name")}
                      className={registerForm.formState.errors.name ? "border-red-500" : ""}
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="daniel.treku@university.edu"
                      {...registerForm.register("email")}
                      className={registerForm.formState.errors.email ? "border-red-500" : ""}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      {...registerForm.register("password")}
                      className={registerForm.formState.errors.password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Professor, Dr., etc."
                      {...registerForm.register("title")}
                      className={registerForm.formState.errors.title ? "border-red-500" : ""}
                    />
                    {registerForm.formState.errors.title && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      onValueChange={(value) => registerForm.setValue("role", value as "instructor" | "student")}
                      defaultValue="instructor"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instructor">Instructor/Educator</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.role && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.role.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="Computer Science, Mathematics, etc."
                    {...registerForm.register("department")}
                    className={registerForm.formState.errors.department ? "border-red-500" : ""}
                  />
                  {registerForm.formState.errors.department && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    placeholder="University or Organization Name"
                    {...registerForm.register("institution")}
                    className={registerForm.formState.errors.institution ? "border-red-500" : ""}
                  />
                  {registerForm.formState.errors.institution && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.institution.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Creating Account..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={signinForm.handleSubmit(handleSignin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@institution.edu"
                    {...signinForm.register("email")}
                    className={signinForm.formState.errors.email ? "border-red-500" : ""}
                  />
                  {signinForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{signinForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...signinForm.register("password")}
                      className={signinForm.formState.errors.password ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {signinForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{signinForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                  setSuccess("");
                }}
                className="text-sm"
              >
                {isRegistering ? "Already have an account? Sign in" : "Need an account? Register here"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegistering 
              ? "Registration requires admin approval. You'll be notified when your account is activated."
              : "Having trouble? Contact your administrator for assistance."
            }
          </p>
        </div>
      </div>
    </div>
  );
}