import * as routesService from '../services/routes.service.js';

export const getRoutes = async (req, res, next) => {
  try {
    const routes = await routesService.getRoutes();
    res.status(200).json({ ok: true, data: routes });
  } catch (e) {
    next(e);
  }
};

export const createRoute = async (req, res, next) => {
  try {
    const route = await routesService.createRoute(req.body);
    res.status(201).json({ ok: true, data: route });
  } catch (e) {
    next(e);
  }
};

export const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const route = await routesService.updateRoute(id, req.body);
    res.status(200).json({ ok: true, data: route });
  } catch (e) {
    next(e);
  }
};

export const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    await routesService.deleteRoute(id);
    res.status(200).json({ ok: true, data: { message: 'Route deleted successfully' } });
  } catch (e) {
    next(e);
  }
};