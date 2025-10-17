<script>
	import { onMount } from 'svelte';
	
	onMount(() => {
		// TODO: Implementar lógica de inicialización
	});
</script>

<svelte:head>
	<title>Logística G12 - Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="container mx-auto px-4 py-8">
		<header class="mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">
				🚚 Logística G12
			</h1>
			<p class="text-gray-600">
				Sistema de gestión de logística y transporte
			</p>
		</header>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					📦 Envíos
				</h3>
				<p class="text-gray-600 mb-4">
					Gestiona envíos y seguimiento
				</p>
				<button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
					Ver Envíos
				</button>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					🚛 Transporte
				</h3>
				<p class="text-gray-600 mb-4">
					Configura métodos de transporte
				</p>
				<button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
					Configurar
				</button>
			</div>

			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					📊 Reportes
				</h3>
				<p class="text-gray-600 mb-4">
					Estadísticas y análisis
				</p>
				<button class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
					Ver Reportes
				</button>
			</div>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">
				🎯 Estado del Sistema
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="text-center">
					<div class="text-3xl font-bold text-blue-600">4</div>
					<div class="text-sm text-gray-600">Tipos de Transporte</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-green-600">10</div>
					<div class="text-sm text-gray-600">Zonas de Cobertura</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-purple-600">0</div>
					<div class="text-sm text-gray-600">Envíos Activos</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-orange-600">100%</div>
					<div class="text-sm text-gray-600">Sistema Operativo</div>
				</div>
			</div>
		</div>
	</div>
</div>
