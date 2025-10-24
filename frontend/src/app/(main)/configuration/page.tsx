import { redirect } from "next/navigation";

/**
 * Página de configuración por defecto
 * Redirige a la primera sub-página (cotización)
 */
export default function ConfigurationIndexPage() {
  redirect("/configuration/cotizacion");
}
