import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

const AUTOCOMPLETE_DELAY_MS = 350;

const parseNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeSuggestion = (item, index) => {
  const label =
    item?.formatted_address ??
    item?.name ??
    item?.display_name ??
    item?.primary_text ??
    item?.title ??
    item?.text ??
    item?.address ??
    item?.description ??
    '';

  const secondary =
    item?.secondary_text ??
    item?.structured_formatting?.secondary_text ??
    item?.description ??
    item?.address_line ??
    (Array.isArray(item?.terms)
      ? item.terms
          .slice(1)
          .map((term) => term.value || term)
          .filter(Boolean)
          .join(', ')
      : '') ??
    '';

  const lat =
    parseNumber(item?.lat) ??
    parseNumber(item?.latitude) ??
    parseNumber(item?.center?.lat) ??
    parseNumber(item?.geometry?.location?.lat) ??
    parseNumber(item?.geometry?.lat) ??
    parseNumber(item?.coordinates?.lat) ??
    parseNumber(item?.location?.lat) ??
    (Array.isArray(item?.location) ? parseNumber(item.location[1]) : undefined);

  const lng =
    parseNumber(item?.lng) ??
    parseNumber(item?.lon) ??
    parseNumber(item?.longitude) ??
    parseNumber(item?.center?.lng) ??
    parseNumber(item?.center?.lon) ??
    parseNumber(item?.geometry?.location?.lng) ??
    parseNumber(item?.geometry?.location?.lon) ??
    parseNumber(item?.geometry?.lng) ??
    parseNumber(item?.geometry?.lon) ??
    parseNumber(item?.coordinates?.lng) ??
    parseNumber(item?.coordinates?.lon) ??
    parseNumber(item?.location?.lng) ??
    parseNumber(item?.location?.lon) ??
    (Array.isArray(item?.location) ? parseNumber(item.location[0]) : undefined);

  const id =
    item?.id ??
    item?.place_id ??
    item?.reference ??
    item?.uuid ??
    `${label || 'suggestion'}-${index}`;

  return {
    id,
    label,
    secondary,
    lat,
    lng,
    geoid: item?.geoid,
    raw: item,
  };
};

export default function AddressInput({
  placeholder = 'Search location...',
  onSearch,
  onSelect,
  locationBias = 'Karnataka',
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: query.trim() });
        if (locationBias) {
          params.append('location_bias', locationBias);
        }

        const response = await fetch(`/api/autocomplete?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        const payload = await response.json();
        const rawSuggestions =
          (Array.isArray(payload?.predictions) && payload.predictions) ||
          (Array.isArray(payload?.data) && payload.data) ||
          (Array.isArray(payload?.results) && payload.results) ||
          (Array.isArray(payload?.suggestions) && payload.suggestions) ||
          [];

        const normalized = rawSuggestions
          .map((item, index) => normalizeSuggestion(item, index))
          .filter((item) => Boolean(item.label));

        if (!active) return;

        setSuggestions(normalized);
        setIsOpen(normalized.length > 0);
      } catch (err) {
        if (!active || err.name === 'AbortError') return;
        console.error('Autocomplete fetch failed:', err);
        setSuggestions([]);
        setError('Unable to fetch suggestions');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }, AUTOCOMPLETE_DELAY_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, locationBias]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (suggestions.length === 0) {
      setIsOpen(false);
      return;
    }

    const [firstSuggestion] = suggestions;
    await handleSuggestionSelect(firstSuggestion);
  };

  const resolveCoordinates = async (suggestion) => {
    if (Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lng)) {
      setIsResolving(false);
      return { lat: suggestion.lat, lng: suggestion.lng };
    }

    setIsResolving(true);

    try {
      const encodedAddress = encodeURIComponent(suggestion.label);
      const response = await fetch(`/codes?address=${encodedAddress}`);

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      const payload = await response.json();

      const candidates = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.suggestions)
        ? payload.suggestions
        : Array.isArray(payload)
        ? payload
        : [];

      for (const candidate of candidates) {
        const lat =
          parseNumber(candidate?.lat) ??
          parseNumber(candidate?.latitude) ??
          parseNumber(candidate?.center?.lat) ??
          parseNumber(candidate?.geometry?.location?.lat) ??
          parseNumber(candidate?.geometry?.lat);
        const lng =
          parseNumber(candidate?.lng) ??
          parseNumber(candidate?.lon) ??
          parseNumber(candidate?.longitude) ??
          parseNumber(candidate?.center?.lng) ??
          parseNumber(candidate?.center?.lon) ??
          parseNumber(candidate?.geometry?.location?.lng) ??
          parseNumber(candidate?.geometry?.location?.lon) ??
          parseNumber(candidate?.geometry?.lng) ??
          parseNumber(candidate?.geometry?.lon);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }

      console.warn('No geocode candidates returned coordinates for', suggestion);
      return null;
    } catch (err) {
      console.error('Failed to resolve coordinates for suggestion:', err);
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    if (!suggestion) return;
    setQuery(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);

    setError(null);

    const coordinates = await resolveCoordinates(suggestion);

    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
      setError('Could not determine coordinates for the selected address');
      return;
    }

    const payload = {
      name: suggestion.label,
      label: suggestion.label,
      secondary: suggestion.secondary,
      lat: coordinates.lat,
      lng: coordinates.lng,
      geoid: suggestion.geoid,
      raw: suggestion.raw,
    };

    onSelect?.(payload);
    onSearch?.(payload);
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setError(null);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 bg-white"
        />
        {(isLoading || isResolving) && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <button type="submit" className="hidden" />
      </form>

      {(isOpen || error) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg">
          {error && (
            <div className="px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {!error && suggestions.length === 0 && !isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matches found
            </div>
          )}

          {!error && suggestions.length > 0 && (
            <ul className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionSelect(suggestion);
                  }}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                >
                  <div className="font-medium text-foreground">
                    {suggestion.label}
                  </div>
                  {suggestion.secondary && (
                    <div className="text-xs text-muted-foreground">
                      {suggestion.secondary}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
