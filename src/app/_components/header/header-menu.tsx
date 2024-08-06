import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/_components/ui/sheet";
import { Project } from "@/lib/definitions";
import { Brain, Menu } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import DropdownUser from "./dropdown-user";
import HeaderLink from "./header-link";

export default async function HeaderMenu({ project }: { project?: Project }) {

  const t = await getTranslations("Project.Header");

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Brain className="h-6 w-6" />
          <span className="sr-only">{t('title')}</span>
        </Link>
        {project && (
          <>
            <HeaderLink href={`/projects/${project.slug}`}>{t('dashboard')}</HeaderLink>
            <HeaderLink href={`/projects/${project.slug}/data`}>{t('data')}</HeaderLink>
            <HeaderLink href={`/projects/${project.slug}/playground`}>{t('playground')}</HeaderLink>
            <HeaderLink href={`/projects/${project.slug}/tasks`}>{t('tasks')}</HeaderLink>
            <HeaderLink href={`/projects/${project.slug}/settings`}>{t('settings')}</HeaderLink>
          </>
        )}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('toggleNavigation')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Brain className="h-6 w-6" />
              <span className="sr-only">{t('title')}</span>
            </Link>
            {project && (
              <>
                <HeaderLink href={`/projects/${project.slug}`}>{t('dashboard')}</HeaderLink>
                <HeaderLink href={`/projects/${project.slug}/data`}>{t('data')}</HeaderLink>
                <HeaderLink href={`/projects/${project.slug}/playground`}>{t('playground')}</HeaderLink>
                <HeaderLink href={`/projects/${project.slug}/tasks`}>{t('tasks')}</HeaderLink>
                <HeaderLink href={`/projects/${project.slug}/settings`}>{t('settings')}</HeaderLink>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full justify-end items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <SessionProvider>
          <DropdownUser />
        </SessionProvider>
      </div>
    </header>
  )
}