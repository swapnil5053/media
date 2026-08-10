import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { useAccount, useSignUp } from "@/hooks/use-account";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function SignUp() {
  const navigate = useNavigate();
  const { data: account } = useAccount();
  const signUp = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (account) return <Navigate to="/library" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    signUp.mutate({ name, email, password }, { onSuccess: () => navigate("/library") });
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="Free for your first five videos. No card needed."
      footer={
        <>
          Already have one?{" "}
          <Link to="/signin" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Name">
          {(id) => (
            <Input id={id} autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
          )}
        </Field>

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

        <Field label="Password" hint="At least 8 characters.">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

        {signUp.isError ? (
          <p className="text-[13px] text-critical">
            {signUp.error instanceof ApiError ? signUp.error.message : "Something went wrong."}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={signUp.isPending}>
          {signUp.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
