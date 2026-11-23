import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../utils/auth";

interface LoginDialogProps {
  open: boolean;
  onSuccess: () => void;
}

export default function LoginDialog({ open, onSuccess }: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message === "Invalid credentials" ? "Sai tên đăng nhập hoặc mật khẩu" : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[400px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle>Đăng nhập</DialogTitle>
          <DialogDescription>
            Nhập thông tin đăng nhập để truy cập AI Content Studio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
