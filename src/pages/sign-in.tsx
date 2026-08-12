import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { useAccount, useSignIn } from "@/hooks/use-account";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function SignIn() {
  const navigate = useNavigate();
  const { data: account } = useAccount();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (account) return <Navigate to="/library" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    signIn.mutate({ email, password }, { onSuccess: () => navigate("/library") });
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your library."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="text-positive hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>

        <Field label="Password">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

        {signIn.isError ? (
          <p className="text-[13px] text-critical">
            {signIn.error instanceof ApiError ? signIn.error.message : "Something went wrong."}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
