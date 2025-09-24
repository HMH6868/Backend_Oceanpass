import * as portsService from '../services/ports.service.js';

export const getPorts = async (req, res, next) => {
  try {
    const ports = await portsService.getPorts();
    res.status(200).json({ ok: true, data: ports });
  } catch (e) {
    next(e);
  }
};

export const createPort = async (req, res, next) => {
  try {
    const port = await portsService.createPort(req.body);
    res.status(201).json({ ok: true, data: port });
  } catch (e) {
    next(e);
  }
};

export const updatePort = async (req, res, next) => {
  try {
    const { id } = req.params;
    const port = await portsService.updatePort(id, req.body);
    res.status(200).json({ ok: true, data: port });
  } catch (e) {
    next(e);
  }
};

export const deletePort = async (req, res, next) => {
  try {
    const { id } = req.params;
    await portsService.deletePort(id);
    res.status(200).json({ ok: true, data: { message: 'Port deleted successfully' } });
  } catch (e) {
    next(e);
  }
};