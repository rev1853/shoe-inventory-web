import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SERVER_OPTIONS, getStoredApiBaseUrl, setStoredApiBaseUrl } from '../lib/serverConfig';
import { clearStoredAuth } from '../lib/authStorage';

interface LoginPageProps {
    onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [server, setServer] = useState(getStoredApiBaseUrl());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await onLogin(email, password, rememberMe);
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6f4f2] to-[#e4d7d8] p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle>Footsy</CardTitle>
                        <CardDescription>Footwear Stock Inventory</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-5">
                        <Label htmlFor="server">API Server</Label>
                        <Select
                            value={server}
                            onValueChange={(value) => {
                                if (value === server) return;
                                setServer(value);
                                setStoredApiBaseUrl(value);
                                clearStoredAuth();
                                window.location.reload();
                            }}
                        >
                            <SelectTrigger id="server">
                                <SelectValue placeholder="Choose server" />
                            </SelectTrigger>
                            <SelectContent>
                                {SERVER_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Changing server reloads and clears the current session.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@shoestore.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 rounded border border-border"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <Label htmlFor="remember" className="text-sm">
                                Remember me
                            </Label>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" disabled={loading} className="w-full disabled:opacity-70">
                            {loading ? 'Signing in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
