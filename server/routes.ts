import { posts } from './../node_modules/@reduxjs/toolkit/src/query/tests/mocks/handlers';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { type Request, type Response } from "express";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // PUT APPLICATION ROUTES HERE
  // prefix all routes with /api

  // POST /api/apikey
  // Returns the API key stored in the environment variable `API_KEY`.
  // Accepts an optional JSON body { lng, lat } so client can send click coords.
  // app.post('/api/apikey', (req: Request, res: Response) => {
  //   const key = process.env.API_KEY || null;
  //   const { lng, lat } = (req.body as any) || {};
  //   if (lng !== undefined && lat !== undefined) {
  //     console.log(`[api] apikey requested for coords: ${lng},${lat}`);
  //   } else {
  //     console.log('[api] apikey requested');
  //   }

  //   // Return the key in a simple JSON envelope. Client should keep this safe.
  //   res.json({ key });
  // });

  // POST /api/coffee-shops
  // app.post("/api/coffee-shops", async (req: Request, res: Response) => {
  //   try {
  //     const { latitude, longitude } = (req.body as any) || {};

  //     if (!latitude || !longitude) {
  //       return res.status(400).json({ error: "latitude and longitude are required" });
  //     }

  //     const radius = 2000; // 2 km

  //     const query = `
  //       [out:json][timeout:25];
  //       (
  //         node["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //         node["shop"="coffee"](around:${radius},${latitude},${longitude});
  //         way["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //         way["shop"="coffee"](around:${radius},${latitude},${longitude});
  //         relation["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //         relation["shop"="coffee"](around:${radius},${latitude},${longitude});
  //       );
  //       out center meta;
  //     `;

  //     const url = "https://overpass-api.de/api/interpreter";

  //     const response = await axios.post(url, query, {
  //       headers: { "Content-Type": "text/plain" }
  //     });

  //     const results = [];
  //     const seen = new Set();

  //     for (const el of response.data.elements) {
  //       const lat = el.lat || el.center?.lat;
  //       const lon = el.lon || el.center?.lon;
  //       if (!lat || !lon) continue;

  //       const idKey = `${el.type}-${el.id}`;
  //       if (seen.has(idKey)) continue;
  //       seen.add(idKey);

  //       results.push({
  //         id: el.id,
  //         name: el.tags?.name || "Unknown",
  //         category: el.tags?.amenity || el.tags?.shop || "coffee",
  //         latitude: lat,
  //         longitude: lon,
  //         tags: el.tags || {}
  //       });
  //     }

  //     res.json({
  //       count: results.length,
  //       results
  //     });

  //   } catch (err: any) {
  //     console.error(err);
  //     res.status(500).json({ error: "Server error", details: err.message });
  //   }
  // });

  // app.post("/api/coffee-shops", async (req: Request, res: Response) => {
  //   try {
  //     console.log("BODY RECEIVED:", req.body);

  //     // Accept both {latitude, longitude} AND {lat, lng}
  //     let { latitude, longitude, lat, lng } = req.body;

  //     // Auto-map fallback values
  //     latitude = latitude ?? lat;
  //     longitude = longitude ?? lng;

  //     if (!latitude || !longitude) {
  //       return res
  //         .status(400)
  //         .json({ error: "latitude and longitude are required" });
  //     }

  //     const radius = 2000; // 2 km

  //     const query = `
  //     [out:json][timeout:25];
  //     (
  //       node["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //       node["shop"="coffee"](around:${radius},${latitude},${longitude});
  //       way["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //       way["shop"="coffee"](around:${radius},${latitude},${longitude});
  //       relation["amenity"="cafe"](around:${radius},${latitude},${longitude});
  //       relation["shop"="coffee"](around:${radius},${latitude},${longitude});
  //     );
  //     out center meta;
  //   `;

  //     // const url = "https://overpass-api.de/api/interpreter";
  //     const url = "https://overpass.kumi.systems/api/interpreter";

  //     const response = await axios.post(url, query, {
  //       headers: { "Content-Type": "text/plain" },
  //     });

  //     const results = [];
  //     const seen = new Set();

  //     for (const el of response.data.elements) {
  //       const lat = el.lat || el.center?.lat;
  //       const lon = el.lon || el.center?.lon;
  //       if (!lat || !lon) continue;

  //       const idKey = `${el.type}-${el.id}`;
  //       if (seen.has(idKey)) continue;
  //       seen.add(idKey);

  //       results.push({
  //         id: el.id,
  //         name: el.tags?.name || "Unknown",
  //         category: el.tags?.amenity || el.tags?.shop || "coffee",
  //         latitude: lat,
  //         longitude: lon,
  //         tags: el.tags || {},
  //       });
  //     }

  //     res.json({
  //       count: results.length,
  //       results,
  //     });
  //   } catch (err: any) {
  //     console.error(err);
  //     res.status(500).json({ error: "Server error", details: err.message });
  //   }
  // });

  // Dynamic query API
  // POST /api/places-nearby
  app.post("/api/places-nearby", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, categories } = (req.body as any) || {};

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ error: "latitude and longitude required" });
      }

      if (!Array.isArray(categories) || categories.length === 0) {
        return res
          .status(400)
          .json({ error: "categories must be a non-empty array" });
      }

      const radius = 2000;

      // Build dynamic Overpass filters from user input
      const filterQuery = categories
        .map((item) => {
          if (!item.includes("=")) return ""; // skip invalid format
          const [key, value] = item.split("=");
          return `
            node["${key}"="${value}"](around:${radius},${latitude},${longitude});
            way["${key}"="${value}"](around:${radius},${latitude},${longitude});
            relation["${key}"="${value}"](around:${radius},${latitude},${longitude});
          `;
        })
        .join("\n");

      const query = `
        [out:json][timeout:25];
        (
          ${filterQuery}
        );
        out center meta;
      `;

      const response = await axios.post(
        "https://overpass-api.de/api/interpreter",
        query,
        { headers: { "Content-Type": "text/plain" } }
      );

      const results = [];
      const seen = new Set();

      for (const el of response.data.elements) {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        if (!lat || !lon) continue;

        const idKey = `${el.type}-${el.id}`;
        if (seen.has(idKey)) continue;
        seen.add(idKey);

        results.push({
          id: el.id,
          name: el.tags?.name || "Unknown",
          category: el.tags?.amenity || el.tags?.shop || "unknown",
          latitude: lat,
          longitude: lon,
          tags: el.tags || {},
        });
      }

      res.json({
        count: results.length,
        results,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  });


  app.post('/api/address', async (req:Request, res:Response) => {
    console.log("API",process.env.LATLONG_API_KEY);
    const { lat ,lon} = req.query;

    if (!lat && !lon) {
        return res.status(400).json({ error: "Query 'address' is required" });
    }

    try {
        const response = await axios.get("https://apihub.latlong.ai/v4/reverse_geocode", {
            params: {
                lat: lat,
                lon: lon
            },
            headers: {
                 'X-Authorization-Token': process.env.LATLONG_API_KEY
            }
        });
        console.log("API :",process.env.LATLONG_API_KEY);
        console.log(response.data);
        res.json(response.data);

    } catch (error: any) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch geocode data" });
    }
});

  // Autocomplete proxy endpoint
  app.get("/api/autocomplete", async (req: Request, res: Response) => {
    const apiKey = process.env.LATLONG_API_KEY;
    if (!apiKey) {
      console.error("LATLONG_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const schema = z.object({
      query: z.string().trim().min(1, "query is required"),
      location_bias: z.string().trim().optional(),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

    const { query, location_bias } = parseResult.data;

    try {
      console.log(
        `[API] Autocomplete query: ${query}${location_bias ? ` (bias: ${location_bias})` : ""}`
      );

      const response = await axios.get(
        "https://apihub.latlong.ai/v4/autocomplete.json",
        {
          params: {
            query,
            ...(location_bias ? { location_bias } : {}),
          },
          headers: {
            "X-Authorization-Token": apiKey,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error(
        "LatLong Autocomplete Error:",
        error.response?.data || error.message
      );

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        "Failed to fetch autocomplete results";

      res.status(status).json({ error: message });
    }
  });

  // Reverse geocode endpoint
  app.get("/api/reverse-geocode", async (req: Request, res: Response) => {
    const apiKey = process.env.LATLONG_API_KEY;
    if (!apiKey) {
      console.error("LATLONG_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const schema = z.object({
      latitude: z.coerce
        .number({ invalid_type_error: "latitude must be a number" })
        .min(-90, "latitude must be >= -90")
        .max(90, "latitude must be <= 90"),
      longitude: z.coerce
        .number({ invalid_type_error: "longitude must be a number" })
        .min(-180, "longitude must be >= -180")
        .max(180, "longitude must be <= 180"),
      details: z
        .union([
          z.string().transform((value) => value === "true"),
          z.boolean(),
        ])
        .optional(),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

    const { latitude, longitude, details } = parseResult.data;

    try {
      console.log(
        `[API] Reverse geocode request: ${latitude}, ${longitude}` +
          (typeof details === "boolean" ? ` (details: ${details})` : "")
      );

      const response = await axios.get(
        "https://apihub.latlong.ai/v4/reverse_geocode.json",
        {
          params: {
            latitude,
            longitude,
            ...(typeof details === "boolean" ? { details } : {}),
          },
          headers: {
            "X-Authorization-Token": apiKey,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error(
        "LatLong Reverse Geocode Error:",
        error.response?.data || error.message
      );

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        "Failed to fetch reverse geocode data";

      res.status(status).json({ error: message });
    }
  });

  // Autosuggest (landmarks) endpoint
  app.get("/api/autosuggest", async (req: Request, res: Response) => {
    const apiKey = process.env.LATLONG_API_KEY;
    if (!apiKey) {
      console.error("LATLONG_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const schema = z.object({
      query: z.string().trim().min(1, "query is required"),
      latitude: z.coerce
        .number({ invalid_type_error: "latitude must be a number" })
        .min(-90, "latitude must be >= -90")
        .max(90, "latitude must be <= 90"),
      longitude: z.coerce
        .number({ invalid_type_error: "longitude must be a number" })
        .min(-180, "longitude must be >= -180")
        .max(180, "longitude must be <= 180"),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

    const { query, latitude, longitude } = parseResult.data;

    try {
      console.log(
        `[API] Autosuggest request: ${query} at ${latitude}, ${longitude}`
      );

      const response = await axios.get(
        "https://apihub.latlong.ai/v5/autosuggest.json",
        {
          params: { query, latitude, longitude },
          headers: {
            "X-Authorization-Token": apiKey,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error(
        "LatLong Autosuggest Error:",
        error.response?.data || error.message
      );

      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        "Failed to fetch autosuggest data";

      res.status(status).json({ error: message });
    }
  });

  // Geocode proxy endpoint
  // Example: GET /codes?address=1600+Amphitheatre+Parkway
  app.get('/codes', async (req: Request, res: Response) => {
    const apiKey = process.env.LATLONG_API_KEY;
    if (!apiKey) {
      console.error("LATLONG_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const schema = z.object({
      address: z.string().min(1, "Address is required"),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { address } = parseResult.data;

    try {
      console.log(`[API] Geocoding address: ${address}`);
      const response = await axios.get('https://apihub.latlong.ai/v4/geocode.json', {
        params: {
          address,
          accuracy_level: true,
        },
        headers: {
          'X-Authorization-Token': apiKey,
        },
      });

      console.log('[API] Response:', response.data);
      res.json(response.data);
    } catch (error: any) {
      console.error('LatLong API Error:', error.response?.data || error.message);
      
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || "Failed to fetch geocode data";
      
      res.status(status).json({ error: message });
    }
  });

  return httpServer;
}
