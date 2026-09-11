export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <main id="main" className="p-10 font-display text-4xl">merhaba {locale}</main>;
}
