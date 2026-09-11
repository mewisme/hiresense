'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { LucideIcon } from 'lucide-react';
import {
  BriefcaseBusiness,
  Building2,
  ChevronUp,
  CircleUserRound,
  FileCheck2,
  Files,
  Home,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@hiresense/ui/components/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@hiresense/ui/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hiresense/ui/components/dropdown-menu';
import { Separator } from '@hiresense/ui/components/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@hiresense/ui/components/sidebar';
import { clearAuthSession, useAuthSession } from '@/lib/api-client';

type AppRole = 'candidate' | 'recruiter';

type NavigationItem = { href: string; label: string; icon: LucideIcon };

const candidateNavigation: NavigationItem[] = [
  { href: '/candidate', label: 'Overview', icon: Home },
  { href: '/candidate/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { href: '/candidate/applications', label: 'Applications', icon: FileCheck2 },
  { href: '/candidate/resumes', label: 'Resumes', icon: Files },
  { href: '/candidate/profile', label: 'Profile', icon: UserRound },
];

const recruiterNavigation: NavigationItem[] = [
  { href: '/recruiter', label: 'Overview', icon: Home },
  { href: '/recruiter/companies', label: 'Companies', icon: Building2 },
  { href: '/recruiter/profile', label: 'Profile', icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/candidate' || href === '/recruiter') return false;
  return pathname.startsWith(`${href}/`);
}

function getCompanyId(pathname: string) {
  return pathname.match(/^\/recruiter\/companies\/([^/]+)/)?.[1] ?? null;
}

function getPageTitle(pathname: string, role: AppRole) {
  if (role === 'candidate') {
    if (pathname === '/candidate') return 'Overview';
    if (pathname === '/candidate/profile') return 'Profile';
    if (pathname === '/candidate/resumes') return 'Resumes';
    if (pathname === '/candidate/jobs') return 'Jobs';
    if (/^\/candidate\/jobs\/[^/]+$/.test(pathname)) return 'Job details';
    if (pathname === '/candidate/applications') return 'Applications';
    if (/^\/candidate\/applications\/[^/]+$/.test(pathname)) return 'Application details';
    return 'Candidate';
  }

  if (pathname === '/recruiter') return 'Overview';
  if (pathname === '/recruiter/profile') return 'Profile';
  if (pathname === '/recruiter/companies') return 'Companies';
  if (/^\/recruiter\/companies\/[^/]+$/.test(pathname)) return 'Company';
  if (/^\/recruiter\/companies\/[^/]+\/jobs$/.test(pathname)) return 'Jobs';
  if (/^\/recruiter\/companies\/[^/]+\/jobs\/new$/.test(pathname)) return 'Create job';
  if (/^\/recruiter\/companies\/[^/]+\/jobs\/[^/]+\/applications$/.test(pathname))
    return 'Applicants';
  if (/^\/recruiter\/companies\/[^/]+\/applications\/[^/]+$/.test(pathname))
    return 'Applicant review';
  if (/^\/recruiter\/companies\/[^/]+\/jobs\/[^/]+$/.test(pathname)) return 'Job details';
  return 'Recruiter';
}

function AppNavigation({ items, pathname }: { items: NavigationItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActivePath(pathname, item.href)}
                tooltip={item.label}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function RecruiterCompanyNavigation({ pathname }: { pathname: string }) {
  const companyId = getCompanyId(pathname);
  if (!companyId) return null;
  const items: NavigationItem[] = [
    { href: `/recruiter/companies/${companyId}`, label: 'Company overview', icon: Building2 },
    { href: `/recruiter/companies/${companyId}/jobs`, label: 'Jobs', icon: BriefcaseBusiness },
  ];
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Company</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActivePath(pathname, item.href)}
                tooltip={item.label}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AccountMenu({ role }: { role: AppRole }) {
  const router = useRouter();
  const session = useAuthSession();
  const { resolvedTheme, setTheme } = useTheme();
  const email = session?.user.email ?? (role === 'candidate' ? 'Candidate' : 'Recruiter');
  const initials = email.slice(0, 2).toUpperCase();

  function signOut() {
    clearAuthSession();
    router.push('/login');
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
          >
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate font-medium">
                {role === 'candidate' ? 'Candidate' : 'Recruiter'}
              </span>
              <span className="truncate text-[0.625rem] text-muted-foreground">{email}</span>
            </div>
            <ChevronUp className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href={`/${role}/profile`} />}>
                <CircleUserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
                {resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppShell({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const navigation = role === 'candidate' ? candidateNavigation : recruiterNavigation;
  const homeHref = role === 'candidate' ? '/candidate' : '/recruiter';
  const title = getPageTitle(pathname, role);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href={homeHref} />}
                className="data-open:bg-sidebar-accent"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BriefcaseBusiness className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">HireSense</span>
                  <span className="truncate text-[0.625rem] text-muted-foreground">
                    {role === 'candidate' ? 'Candidate workspace' : 'Recruiter workspace'}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <AppNavigation items={navigation} pathname={pathname} />
          {role === 'recruiter' ? <RecruiterCompanyNavigation pathname={pathname} /> : null}
        </SidebarContent>
        <SidebarFooter>
          <AccountMenu role={role} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex w-full items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <span className="text-muted-foreground">
                    {role === 'candidate' ? 'Candidate' : 'Recruiter'}
                  </span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
