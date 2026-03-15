const TransportRoute = require('../models/TransportRoute');
const {
    syncTransportRoutes,
    optimizeDemoTransportRoutes,
} = require('../services/transportService');

const getRoutes = async (_req, res) => {
    const routes = await syncTransportRoutes(TransportRoute);
    res.json({ success: true, data: routes });
};

const createRoute = async (req, res) => {
    const route = await TransportRoute.create(req.body);
    res.status(201).json({ success: true, data: route });
};

const updateRoute = async (req, res) => {
    const route = await TransportRoute.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!route) {
        res.status(404);
        throw new Error('Transport route not found');
    }

    res.json({ success: true, data: route });
};

const optimizeRoutes = async (_req, res) => {
    const storedRoutes = await syncTransportRoutes(TransportRoute);

    const optimized = optimizeDemoTransportRoutes(storedRoutes.map((route) => route.toObject()));

    await Promise.all(
        optimized.map((item) =>
            TransportRoute.findByIdAndUpdate(item._id, {
                predictedDemand: item.predictedDemand,
                status: item.status,
                currentUtilization: item.currentUtilization,
            })
        )
    );

    const refreshed = await TransportRoute.find().sort({ routeName: 1 });
    res.json({ success: true, data: refreshed });
};

module.exports = {
    getRoutes,
    createRoute,
    updateRoute,
    optimizeRoutes,
};
