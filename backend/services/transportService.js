const ROUTE_BLUEPRINTS = [
    {
        routeName: 'Guntur - Amaravathi Road',
        busNumber: 'AP07-1234',
        capacity: 50,
        currentUtilization: 72,
        status: 'Active',
        stops: ['Guntur RTC', 'Kaza Junction', 'Amaravathi Road', 'Campus Main Gate'],
    },
    {
        routeName: 'Guntur - Lakshmipuram',
        busNumber: 'AP07-2456',
        capacity: 52,
        currentUtilization: 68,
        status: 'Active',
        stops: ['Lakshmipuram', 'Brodipet', 'Guntur Bypass', 'Campus Main Gate'],
    },
    {
        routeName: 'Tenali',
        busNumber: 'AP07-3789',
        capacity: 54,
        currentUtilization: 81,
        status: 'Active',
        stops: ['Tenali Bus Stand', 'Sangam Jagarlamudi', 'Penumaka', 'Campus Main Gate'],
    },
    {
        routeName: 'Mangalagiri',
        busNumber: 'AP07-4623',
        capacity: 48,
        currentUtilization: 63,
        status: 'Active',
        stops: ['Mangalagiri', 'Tadepalli', 'Vaddeswaram', 'Campus Main Gate'],
    },
    {
        routeName: 'Bapatla',
        busNumber: 'AP07-5294',
        capacity: 55,
        currentUtilization: 76,
        status: 'Active',
        stops: ['Bapatla', 'Parchur', 'Chirala Road Junction', 'Campus Main Gate'],
    },
    {
        routeName: 'Ponnur - Island Center',
        busNumber: 'AP07-6135',
        capacity: 50,
        currentUtilization: 59,
        status: 'Maintenance',
        stops: ['Ponnur', 'Island Center', 'Namburu', 'Campus Main Gate'],
    },
    {
        routeName: 'Amaravathi',
        busNumber: 'AP07-7241',
        capacity: 52,
        currentUtilization: 66,
        status: 'Active',
        stops: ['Amaravathi', 'Mandadam', 'Velagapudi', 'Campus Main Gate'],
    },
    {
        routeName: 'Narasaraopet',
        busNumber: 'AP07-8362',
        capacity: 53,
        currentUtilization: 74,
        status: 'Active',
        stops: ['Narasaraopet', 'Sattenapalli', 'Perecherla', 'Campus Main Gate'],
    },
];

const ROUTE_NAME_SET = new Set(ROUTE_BLUEPRINTS.map((route) => route.routeName));

const generateDemoTransportRoutes = () => {
    return ROUTE_BLUEPRINTS.map((route) => ({
        routeName: route.routeName,
        busNumber: route.busNumber,
        stops: route.stops,
        capacity: route.capacity,
        currentUtilization: route.currentUtilization,
        predictedDemand: Math.min(100, Math.round(route.currentUtilization * 1.08)),
        status: route.status,
    }));
};

const syncTransportRoutes = async (TransportRoute) => {
    const existing = await TransportRoute.find().select('routeName busNumber capacity currentUtilization status');
    const existingByName = new Map(
        existing.map((route) => [String(route.routeName || '').trim(), route])
    );

    const isSynced =
        existing.length === ROUTE_BLUEPRINTS.length &&
        ROUTE_BLUEPRINTS.every((expected) => {
            const current = existingByName.get(expected.routeName);
            if (!current) return false;
            return (
                String(current.busNumber || '').trim() === expected.busNumber &&
                Number(current.capacity) === Number(expected.capacity) &&
                Number(current.currentUtilization) === Number(expected.currentUtilization) &&
                String(current.status || '').trim() === expected.status
            );
        });

    if (isSynced) {
        return TransportRoute.find().sort({ routeName: 1 });
    }

    await TransportRoute.deleteMany({});
    await TransportRoute.insertMany(generateDemoTransportRoutes());
    return TransportRoute.find().sort({ routeName: 1 });
};

const optimizeDemoTransportRoutes = (routes = []) => {
    return routes.map((route) => {
        const utilization = Number(route.currentUtilization) || 0;
        const predictedDemand = Math.min(100, Math.max(20, Math.round(utilization * 1.15)));

        return {
            ...route,
            predictedDemand,
            recommendation:
                predictedDemand >= 85
                    ? 'Add extra trip in peak hours'
                    : predictedDemand <= 40
                        ? 'Consolidate with nearby route'
                        : 'Maintain current frequency',
        };
    });
};

module.exports = {
    generateDemoTransportRoutes,
    syncTransportRoutes,
    optimizeDemoTransportRoutes,
};
