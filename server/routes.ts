import type { Express } from "express";
import { createServer, type Server } from "http";
import { type Request, type Response } from "express";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import {
  bbox as turfBbox,
  bboxPolygon as turfBboxPolygon,
  circle as turfCircle,
  featureCollection,
  hexGrid as turfHexGrid,
  area as turfArea,
  length as turfLength,
  lineString as turfLineString,
  point as turfPoint,
  pointsWithinPolygon,
  centroid as turfCentroid,
  distance as turfDistance,
} from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

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

  app.post("/api/competitor-density", async (req: Request, res: Response) => {
    const schema = z.object({
      latitude: z.coerce
        .number({ invalid_type_error: "latitude must be a number" })
        .min(-90, "latitude must be >= -90")
        .max(90, "latitude must be <= 90"),
      longitude: z.coerce
        .number({ invalid_type_error: "longitude must be a number" })
        .min(-180, "longitude must be >= -180")
        .max(180, "longitude must be <= 180"),
      categories: z.array(z.string().min(3)).min(1, "categories required"),
      radiusKm: z.coerce
        .number({ invalid_type_error: "radiusKm must be a number" })
        .min(0.2, "radiusKm must be >= 0.2")
        .max(15, "radiusKm must be <= 15")
        .default(2),
      cellKm: z.coerce
        .number({ invalid_type_error: "cellKm must be a number" })
        .min(0.05, "cellKm must be >= 0.05")
        .max(5, "cellKm must be <= 5")
        .default(0.3),
    });

    const parseResult = schema.safeParse(req.body ?? {});

    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

    const { latitude, longitude, categories, radiusKm, cellKm } =
      parseResult.data;

    try {
      const radiusMeters = Math.round(radiusKm * 1000);

      const filterQuery = categories
        .map((item) => {
          if (!item.includes("=")) return "";
          const [key, value] = item.split("=");
          return `
            node["${key}"="${value}"](around:${radiusMeters},${latitude},${longitude});
            way["${key}"="${value}"](around:${radiusMeters},${latitude},${longitude});
            relation["${key}"="${value}"](around:${radiusMeters},${latitude},${longitude});
          `;
        })
        .join("\n");

      if (!filterQuery.trim()) {
        return res.status(400).json({ error: "Invalid categories provided" });
      }

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

      const elements = Array.isArray(response?.data?.elements)
        ? (response.data.elements as Record<string, any>[])
        : [];

      const seen = new Set<string>();
      const pointFeatures: Feature<Point>[] = [];
      const sanitizedPoints: Array<{
        id: number | string;
        name: string;
        category: string;
        latitude: number;
        longitude: number;
        tags: Record<string, unknown>;
      }> = [];

      for (const el of elements) {
        const lat = Number.parseFloat(el?.lat ?? el?.center?.lat);
        const lon = Number.parseFloat(el?.lon ?? el?.center?.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          continue;
        }

        const idKey = `${el?.type ?? "unknown"}-${el?.id ?? "unknown"}`;
        if (seen.has(idKey)) {
          continue;
        }
        seen.add(idKey);

        const name = el?.tags?.name || "Unknown";
        const category =
          el?.tags?.amenity || el?.tags?.shop || el?.tags?.leisure || "unknown";

        sanitizedPoints.push({
          id: el.id,
          name,
          category,
          latitude: lat,
          longitude: lon,
          tags: el?.tags ?? {},
        });

        pointFeatures.push(
          turfPoint([lon, lat], {
            id: el.id,
            name,
            category,
          }) as Feature<Point>
        );
      }

      const mask = turfCircle([longitude, latitude], radiusKm, {
        steps: 64,
        units: "kilometers",
      });

      const bbox = turfBbox(mask);
      const grid = turfHexGrid(bbox, cellKm, {
        units: "kilometers",
        mask,
      });
      const pointCollection = featureCollection<Point>(
        pointFeatures
      ) as FeatureCollection<Point | MultiPoint>;

      let maxCount = 0;

      const countedTiles: Feature<Polygon | MultiPolygon>[] = [];
      let tileIndex = 0;

      for (const feature of grid.features as Feature<
        Polygon | MultiPolygon
      >[]) {
        const pointsInCell = pointsWithinPolygon(pointCollection, feature);
        const count = pointsInCell.features.length;

        maxCount = Math.max(maxCount, count);

  const tileId = `H${tileIndex + 1}`;
  tileIndex += 1;

        countedTiles.push({
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            count,
            id: tileId,
          },
        });
      }

      const tiles = countedTiles.map((feature) => {
        const originalProps = (feature.properties ?? {}) as Record<string, any>;
        const count = originalProps?.count ?? 0;
        const score = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

        return {
          ...feature,
          properties: {
            ...originalProps,
            count,
            score,
          },
        };
      });

      const heatmapPoints: Feature<Point>[] = tiles
        .filter((feature) => (feature.properties?.count ?? 0) > 0)
        .map((feature) => {
          const center = turfCentroid(feature) as Feature<Point>;
          const props = (feature.properties ?? {}) as Record<string, any>;

          center.properties = {
            weight: props?.count ?? 0,
            score: props?.score ?? 0,
            id: props?.id ?? null,
          };

          return center;
        });

      const topTiles = tiles
        .filter((feature) => (feature.properties?.count ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.properties?.count ?? 0) - (a.properties?.count ?? 0)
        )
        .slice(0, 5)
        .map((feature, index) => ({
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            rank: index + 1,
          },
        }));

      return res.json({
        tiles: featureCollection(tiles),
        points: sanitizedPoints,
        topTiles,
        heatmapPoints: featureCollection(heatmapPoints),
        metadata: {
          totalCount: sanitizedPoints.length,
          maxCount,
          radiusKm,
          cellKm,
        },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  });

  app.post("/api/location-context", async (req: Request, res: Response) => {
    const schema = z.object({
      latitude: z.coerce
        .number({ invalid_type_error: "latitude must be a number" })
        .min(-90, "latitude must be >= -90")
        .max(90, "latitude must be <= 90"),
      longitude: z.coerce
        .number({ invalid_type_error: "longitude must be a number" })
        .min(-180, "longitude must be >= -180")
        .max(180, "longitude must be <= 180"),
      radiusMeters: z.coerce
        .number({ invalid_type_error: "radiusMeters must be a number" })
        .min(250, "radiusMeters must be >= 250")
        .max(5000, "radiusMeters must be <= 5000")
        .default(1500),
    });

    const parseResult = schema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

  const { latitude, longitude, radiusMeters } = parseResult.data;
  const originPoint = turfPoint([longitude, latitude]);

    try {
      const adminQuery = `
        [out:json][timeout:30];
        is_in(${latitude},${longitude})->.a;
        (
          rel.a["boundary"="administrative"]["admin_level"~"^(8|9|10)$"];
          way.a["boundary"="administrative"]["admin_level"~"^(8|9|10)$"];
        );
        out tags center bb;
      `;

      const adminResponse = await axios.post(
        "https://overpass-api.de/api/interpreter",
        adminQuery,
        { headers: { "Content-Type": "text/plain" } }
      );

      const adminElements = Array.isArray(adminResponse?.data?.elements)
        ? (adminResponse.data.elements as Record<string, any>[])
        : [];

      const scoredCandidates = adminElements
        .filter((item) => Boolean(item?.tags))
        .map((item) => {
          const adminLevel = Number.parseInt(item?.tags?.admin_level ?? "99", 10);
          const bounds = item?.bounds;
          let boundingAreaSqKm: number | null = null;

          if (
            bounds &&
            Number.isFinite(bounds.minlat) &&
            Number.isFinite(bounds.minlon) &&
            Number.isFinite(bounds.maxlat) &&
            Number.isFinite(bounds.maxlon)
          ) {
            try {
              const bboxPoly = turfBboxPolygon([
                bounds.minlon,
                bounds.minlat,
                bounds.maxlon,
                bounds.maxlat,
              ]);
              boundingAreaSqKm = Number((turfArea(bboxPoly) / 1_000_000).toFixed(3));
            } catch (err) {
              boundingAreaSqKm = null;
            }
          }

          return {
            element: item,
            adminLevel,
            boundingAreaSqKm,
          };
        })
        .sort((a, b) => {
          if (a.adminLevel === b.adminLevel) {
            const areaA = a.boundingAreaSqKm ?? Number.POSITIVE_INFINITY;
            const areaB = b.boundingAreaSqKm ?? Number.POSITIVE_INFINITY;
            return areaA - areaB;
          }
          return b.adminLevel - a.adminLevel;
        });

      const bestAdmin = scoredCandidates.length ? scoredCandidates[0] : null;

        const areaSummary = bestAdmin
          ? {
              adminLevel: bestAdmin.element.tags?.admin_level ?? null,
            }
          : null;

      const roadsQuery = `
        [out:json][timeout:40];
        (
          way["highway"](around:${radiusMeters},${latitude},${longitude});
        );
        out geom tags;
      `;

      const roadsResponse = await axios.post(
        "https://overpass-api.de/api/interpreter",
        roadsQuery,
        { headers: { "Content-Type": "text/plain" } }
      );

      const roadElements = Array.isArray(roadsResponse?.data?.elements)
        ? (roadsResponse.data.elements as Record<string, any>[])
        : [];

      const WALKABLE_TYPES = new Set([
        "footway",
        "pedestrian",
        "living_street",
        "path",
        "track",
        "steps",
        "residential",
        "service",
        "cycleway",
      ]);

      const CYCLE_TYPES = new Set(["cycleway", "path", "track"]);

      const VEHICLE_FOCUS_TYPES = new Set([
        "motorway",
        "motorway_link",
        "trunk",
        "trunk_link",
        "primary",
        "primary_link",
        "secondary",
        "secondary_link",
        "tertiary",
        "tertiary_link",
      ]);

      let totalKm = 0;
      let walkableKm = 0;
      let cycleKm = 0;
      let vehicleKm = 0;
      const lengthByType = new Map<string, number>();

      for (const element of roadElements) {
        const points = Array.isArray(element?.geometry)
          ? (element.geometry as Array<{ lat: number; lon: number }>)
          : [];

        if (points.length < 2) continue;

        const coordinates = points.map((p) => [p.lon, p.lat]);
        const line = turfLineString(coordinates);
        const km = turfLength(line, { units: "kilometers" });

        if (!Number.isFinite(km) || km <= 0) continue;

        const highwayType = element?.tags?.highway ?? "unknown";

        totalKm += km;
        lengthByType.set(highwayType, (lengthByType.get(highwayType) ?? 0) + km);

        if (WALKABLE_TYPES.has(highwayType) || element?.tags?.foot === "yes") {
          walkableKm += km;
        }

        if (CYCLE_TYPES.has(highwayType) || element?.tags?.cycleway) {
          cycleKm += km;
        }

        if (VEHICLE_FOCUS_TYPES.has(highwayType)) {
          vehicleKm += km;
        }
      }

      const transitQuery = `
        [out:json][timeout:35];
        (
          node["public_transport"="station"](around:${radiusMeters},${latitude},${longitude});
          node["highway"="bus_stop"](around:${radiusMeters},${latitude},${longitude});
          node["railway"="station"](around:${radiusMeters},${latitude},${longitude});
        );
        out body;
      `;

      const transitResponse = await axios.post(
        "https://overpass-api.de/api/interpreter",
        transitQuery,
        { headers: { "Content-Type": "text/plain" } }
      );

      const transitElements = Array.isArray(transitResponse?.data?.elements)
        ? (transitResponse.data.elements as Record<string, any>[])
        : [];

      const transitCounts = {
        station: 0,
        busStop: 0,
        railStation: 0,
        total: 0,
      };

      const nearestTransit: Record<
        "station" | "busStop" | "railStation",
        | {
            name: string;
            distanceMeters: number;
            latitude: number;
            longitude: number;
          }
        | null
      > = {
        station: null,
        busStop: null,
        railStation: null,
      };

      for (const element of transitElements) {
        const lat = Number.parseFloat(
          element?.lat ?? element?.center?.lat
        );
        const lon = Number.parseFloat(
          element?.lon ?? element?.center?.lon
        );

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          continue;
        }

        const tags = (element?.tags ?? {}) as Record<string, any>;
        const point = turfPoint([lon, lat]);
        const distanceKm = turfDistance(originPoint, point, {
          units: "kilometers",
        });

        if (!Number.isFinite(distanceKm)) {
          continue;
        }

        const distanceMeters = Math.round(distanceKm * 1000);
        const primaryName =
          typeof tags?.name === "string" && tags.name.trim().length > 0
            ? tags.name.trim()
            : null;
        const englishName =
          typeof tags?.["name:en"] === "string" && tags["name:en"].trim().length > 0
            ? tags["name:en"].trim()
            : null;
        const refName =
          tags?.ref != null && String(tags.ref).trim().length > 0
            ? String(tags.ref).trim()
            : null;
        const name = primaryName ?? englishName ?? refName ?? "Unnamed stop";
        const publicTransportType = tags["public_transport"];
        const highwayTypeTag = tags["highway"];
        const railwayTypeTag = tags["railway"];

        let matched = false;

        if (publicTransportType === "station") {
          matched = true;
          transitCounts.station += 1;
          const existing = nearestTransit.station;
          if (!existing || distanceMeters < existing.distanceMeters) {
            nearestTransit.station = {
              name,
              distanceMeters,
              latitude: lat,
              longitude: lon,
            };
          }
        }

        if (highwayTypeTag === "bus_stop") {
          matched = true;
          transitCounts.busStop += 1;
          const existing = nearestTransit.busStop;
          if (!existing || distanceMeters < existing.distanceMeters) {
            nearestTransit.busStop = {
              name,
              distanceMeters,
              latitude: lat,
              longitude: lon,
            };
          }
        }

        if (railwayTypeTag === "station") {
          matched = true;
          transitCounts.railStation += 1;
          const existing = nearestTransit.railStation;
          if (!existing || distanceMeters < existing.distanceMeters) {
            nearestTransit.railStation = {
              name,
              distanceMeters,
              latitude: lat,
              longitude: lon,
            };
          }
        }

        if (matched) {
          transitCounts.total += 1;
        }
      }

      const walkabilityScore = totalKm > 0 ? Math.round((walkableKm / totalKm) * 100) : null;
      const cycleScore = totalKm > 0 ? Math.round((cycleKm / totalKm) * 100) : null;
      const vehicleShare = totalKm > 0 ? Math.round((vehicleKm / totalKm) * 100) : null;

      const sortedLengths = Array.from(lengthByType.entries())
        .sort((a, b) => b[1] - a[1])
        .reduce<Record<string, number>>((acc, [type, km]) => {
          acc[type] = Number(km.toFixed(3));
          return acc;
        }, {});

      return res.json({
        area: areaSummary,
        roads: {
          radiusMeters,
          totalKm: Number(totalKm.toFixed(3)),
          cycleKm: Number(cycleKm.toFixed(3)),
          vehicleKm: Number(vehicleKm.toFixed(3)),
          lengthByType: sortedLengths,
        },
        scores: {
          walkability: walkabilityScore,
          cycleFriendliness: cycleScore,
          vehicleDominance: vehicleShare,
        },
        transit: {
          radiusMeters,
          counts: {
            station: transitCounts.station,
            busStop: transitCounts.busStop,
            railStation: transitCounts.railStation,
            total: transitCounts.total,
          },
          nearest: {
            station: nearestTransit.station
              ? {
                  name: nearestTransit.station.name,
                  distanceMeters: nearestTransit.station.distanceMeters,
                  latitude: nearestTransit.station.latitude,
                  longitude: nearestTransit.station.longitude,
                }
              : null,
            busStop: nearestTransit.busStop
              ? {
                  name: nearestTransit.busStop.name,
                  distanceMeters: nearestTransit.busStop.distanceMeters,
                  latitude: nearestTransit.busStop.latitude,
                  longitude: nearestTransit.busStop.longitude,
                }
              : null,
            railStation: nearestTransit.railStation
              ? {
                  name: nearestTransit.railStation.name,
                  distanceMeters: nearestTransit.railStation.distanceMeters,
                  latitude: nearestTransit.railStation.latitude,
                  longitude: nearestTransit.railStation.longitude,
                }
              : null,
          },
        },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  });


  app.post('/api/address', async (req:Request, res:Response) => {
    console.log("API",process.env.LATLONG_API_KEY);
    const { lat ,lon} = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Query 'address' is required" });
    }

    try {
        const response = await axios.get("https://apihub.latlong.ai/v4/reverse_geocode.json", {
            params: {
                latitude: lat,
                longitude: lon,
  
            },
            headers: {
                 'X-Authorization-Token': process.env.LATLONG_API_KEY
            }
        });
        console.log("API :",process.env.LATLONG_API_KEY);
        console.log(response.data);
        res.json(response.data);

    } catch (error: any) {
        console.error("API Error for address:", error.response?.data || error.message);
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
            "X-Authorization-Token": process.env.LATLONG_API_KEY,
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
            details: "false",
          },
          headers: {
            "X-Authorization-Token": process.env.LATLONG_API_KEY,
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

  // Simple echo endpoint
  app.post("/api/echo", (req: Request, res: Response) => {
    const schema = z.object({
      text: z.string().min(1, "text is required"),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      const [{ message }] = parseResult.error.errors;
      return res.status(400).json({ error: message });
    }

    const { text } = parseResult.data;
    res.json({ text });
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



// app.post('/api/targeted-ads', async (req: Request, res: Response) => {
//   try {
//     const { latitude, longitude, interests } = (req.body as any) || {};

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: "latitude and longitude required" });
//     }

//     if (!Array.isArray(interests) || interests.length === 0) {
//       return res.status(400).json({ error: "interests must be a non-empty array" });
//     }

//     const radius = 2000;

//     // Build interest query
//     const filterQuery = interests
//       .map((item) => {
//         const [key, value] = item.split("=");
//         return `
//           node["${key}"="${value}"](around:${radius},${latitude},${longitude});
//           way["${key}"="${value}"](around:${radius},${latitude},${longitude});
//           relation["${key}"="${value}"](around:${radius},${latitude},${longitude});
//         `;
//       })
//       .join("\n");

//     const query = `
//       [out:json][timeout:25];
//       (
//         ${filterQuery}
//       );
//       out center meta;
//     `;

//     const response = await axios.post(
//       "https://overpass-api.de/api/interpreter",
//       query,
//       { headers: { "Content-Type": "text/plain" } }
//     );

//     const results = [];
//     const seen = new Set();

//     // haversine distance (KM)
//     const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//       const R = 6371;
//       const dLat = (lat2 - lat1) * Math.PI / 180;
//       const dLon = (lon2 - lon1) * Math.PI / 180;
//       const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(lat1 * Math.PI / 180) *
//           Math.cos(lat2 * Math.PI / 180) *
//           Math.sin(dLon / 2) ** 2;

//       return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     };

//     // Collect POIs
//     for (const el of response.data.elements) {
//       const lat = el.lat || el.center?.lat;
//       const lon = el.lon || el.center?.lon;
//       if (!lat || !lon) continue;

//       const idKey = `${el.type}-${el.id}`;
//       if (seen.has(idKey)) continue;
//       seen.add(idKey);

//       const category =
//         el.tags?.amenity ||
//         el.tags?.shop ||
//         el.tags?.leisure ||
//         el.tags?.building ||
//         "unknown";

//       results.push({
//         id: el.id,
//         name: el.tags?.name || "Unknown",
//         category,
//         latitude: lat,
//         longitude: lon,
//         distance: distanceKm(latitude, longitude, lat, lon),
//         tags: el.tags || {},
//       });
//     }

//     // Group by category → choose nearest item in each group
//     const nearestByCategory: Record<string, any> = {};

//     for (const item of results) {
//       const cat = item.category;
//       if (!nearestByCategory[cat]) {
//           nearestByCategory[cat] = item;
//       } else if (item.distance < nearestByCategory[cat].distance) {
//           nearestByCategory[cat] = item;
//       }
//     }

//     // Final output list
//     const finalResults = Object.values(nearestByCategory);

//     return res.json({
//       count: finalResults.length,
//       results: finalResults,
//     });

//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       error: "Server error",
//       details: error.message,
//     });
//   }
// });


  app.post("/api/targeted-ads", async (req: Request, res: Response) => {
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
  return httpServer;
}
