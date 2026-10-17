import { ArrowRight, Mail, Phone } from "lucide-react";

import { useFounder, useSections, useSite, useTeam } from "@/api/queries";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Paragraphs } from "@/components/ui/Markdown";
import { PageLoader } from "@/components/ui/States";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/context";
import type { PageSection } from "@/types/api";

export default function AboutPage() {
  const { t, path, plural } = useI18n();
  const { data, isLoading } = useSections("about");
  const { data: team = [] } = useTeam();
  const { data: founder } = useFounder();
  const { data: site } = useSite();
  useSeo({ pageKey: "about", title: t("page.aboutTitle") });

  if (isLoading) return <PageLoader />;
  const sections = Object.fromEntries((data?.sections ?? []).map((section) => [section.key, section])) as Record<string, PageSection | undefined>;
  const order = (data?.sections ?? []).map((section) => section.key);
  const hero = sections.about_hero;

  const blocks: Record<string, (section: PageSection) => React.ReactNode> = {
    about_story: (section) => (
      <section key={section.key} className="bg-milk-100 py-24">
        <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-5 text-glacier-700">{section.eyebrow}</p>
            <h2 className="display-lg text-night-900">{section.title}</h2>
            <Paragraphs text={section.body} className="mt-8 text-lg leading-relaxed text-graphite-700" />
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[5/4] overflow-hidden rounded-[var(--radius-card)]">
            <ResponsiveImage media={section.background} sizes="(min-width: 1024px) 45vw, 92vw" className="h-full w-full" />
          </Reveal>
        </div>
      </section>
    ),
    about_mission: (section) => (
      <section key={section.key} className="dark-surface bg-night-900 py-24 text-milk-50">
        <div className="container-page max-w-4xl text-center">
          <Reveal>
            <p className="eyebrow mb-6 justify-center text-sand-300">{section.eyebrow}</p>
            <h2 className="display-lg">{section.title}</h2>
            <p className="mx-auto mt-8 max-w-3xl font-display text-2xl leading-relaxed text-milk-100/85 sm:text-3xl">{section.body}</p>
          </Reveal>
        </div>
      </section>
    ),
    about_principles: (section) => (
      <section key={section.key} className="bg-milk-50 py-24">
        <div className="container-page">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {section.items.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.07} className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-soft)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-glacier-200/60 text-glacier-800">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-2xl font-semibold text-night-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite-600">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ),
    about_founder: (section) =>
      founder ? (
        <section key={section.key} className="bg-milk-100 py-24">
          <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal className="aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
              <ResponsiveImage media={founder.photo} sizes="(min-width: 1024px) 38vw, 92vw" className="h-full w-full" />
            </Reveal>
            <Reveal delay={0.1}>
              <p className="eyebrow mb-5 text-glacier-700">{section.eyebrow}</p>
              <h2 className="display-md text-night-900">{founder.name}</h2>
              <p className="mt-2 text-graphite-600">
                {founder.role} · {plural("years", founder.experience_years)}
              </p>
              {founder.quote ? <blockquote className="mt-8 border-l-2 border-sand-400 pl-6 font-display text-2xl text-graphite-800 italic">{founder.quote}</blockquote> : null}
              <Paragraphs text={founder.bio} className="mt-8 leading-relaxed text-graphite-700" />
              {founder.mission ? <p className="mt-6 leading-relaxed text-graphite-700">{founder.mission}</p> : null}
              {founder.guide_slug ? (
                <LinkButton to={path(`/guides/${founder.guide_slug}`)} variant="outline" className="mt-8">
                  {t("founder.profile")}
                </LinkButton>
              ) : null}
            </Reveal>
          </div>
        </section>
      ) : null,
    about_team: (section) =>
      team.length ? (
        <section key={section.key} className="bg-milk-50 py-24">
          <div className="container-page">
            <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member, index) => (
                <Reveal key={member.id} delay={index * 0.07}>
                  <div className="aspect-square overflow-hidden rounded-[var(--radius-card)]">
                    <ResponsiveImage media={member.photo} sizes="(min-width: 1024px) 22vw, 45vw" className="h-full w-full" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold text-night-900">{member.name}</h3>
                  <p className="text-sm font-semibold text-glacier-700">{member.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-graphite-600">{member.bio}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    about_contacts: (section) => (
      <section key={section.key} className="dark-surface bg-night-950 py-24 text-milk-50">
        <div className="container-page flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-sand-300">{section.eyebrow}</p>
            <h2 className="display-lg max-w-2xl">{section.title}</h2>
            {section.subtitle ? <p className="mt-5 max-w-xl text-milk-200/80">{section.subtitle}</p> : null}
            <div className="mt-8 flex flex-col gap-3 text-milk-100/85">
              {site?.contacts.email ? (
                <a href={`mailto:${site.contacts.email}`} className="inline-flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4 text-sand-300" aria-hidden />
                  {site.contacts.email}
                </a>
              ) : null}
              {site?.contacts.phone ? (
                <a href={`tel:${site.contacts.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-3 hover:text-white">
                  <Phone className="h-4 w-4 text-sand-300" aria-hidden />
                  {site.contacts.phone}
                </a>
              ) : null}
            </div>
          </div>
          {section.primary_label ? (
            <LinkButton to={path(section.primary_link || "/contact")} variant="accent" size="lg" iconAfter={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {section.primary_label}
            </LinkButton>
          ) : null}
        </div>
      </section>
    ),
  };

  return (
    <>
      <PageHero
        title={hero?.title ?? t("page.aboutTitle")}
        eyebrow={hero?.eyebrow}
        subtitle={hero?.subtitle}
        image={hero?.background ?? site?.default_og_image}
        size="lg"
        crumbs={[{ label: t("nav.about") }]}
      />
      {order.filter((key) => key !== "about_hero").map((key) => {
        const section = sections[key];
        const render = blocks[key];
        return section && render ? render(section) : null;
      })}
    </>
  );
}
