import { notFound } from "next/navigation";
import { ConfigurationPageClient } from "./ConfigurationPageClient";

interface ConfigurationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Mapeo de slugs a títulos y descripciones
const pageConfig: Record<
  string,
  { title: string; description: string }
> = {
  vehiculos: {
    title: "Vehículos",
    description: "Gestiona la configuración de vehículos",
  },
  cotizacion: {
    title: "Reglas de cotización",
    description: "Gestiona la configuración de reglas de cotización",
  },
  transporte: {
    title: "Tipos de transporte",
    description: "Gestiona la configuración de tipos de transporte",
  },
  conductores: {
    title: "Conductores",
    description: "Gestiona la configuración de conductores",
  },
};

export default async function ConfigurationPage({ params }: ConfigurationPageProps) {
  const { slug } = await params;
  const config = pageConfig[slug];

  if (!config) {
    notFound();
  }

  return (
    <ConfigurationPageClient
      slug={slug}
      title={config.title}
      description={config.description}
    />
  );
}

// Generar metadata dinámica
export async function generateMetadata({ params }: ConfigurationPageProps) {
  const { slug } = await params;
  const config = pageConfig[slug];

  if (!config) {
    return {
      title: "Página no encontrada",
    };
  }

  return {
    title: `${config.title} | Configuración`,
    description: config.description,
  };
}

// Generar paths estáticos para mejor performance
export function generateStaticParams() {
  return Object.keys(pageConfig).map((slug) => ({
    slug,
  }));
}
