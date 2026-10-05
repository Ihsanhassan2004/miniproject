import React, { useState } from 'react';
import { 
  Car, Bus, Train, KeyRound, Bike, Plane, Footprints, 
  CheckCircle2, Clock, MapPin, Sparkles, Info, ArrowRight,
  ShieldCheck, HelpCircle, Luggage, Utensils, Wifi, MonitorPlay,
  Armchair, Compass
} from 'lucide-react';
import RecommendationBadge from './RecommendationBadge';
import CostBreakdown from './CostBreakdown';

export default function TransportationCard({
  option,
  isSelected = false,
  onSelect,
  onShowOnMap,
  travelers = 1,
  distanceKm = 0
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Determine if this is an airline flight
  const isFlight = (option.mode === 'flight' || (option.category || '').toLowerCase() === 'flight');

  // Icon mapping
  const getIcon = (mode, category) => {
    const m = String(mode || category || '').toLowerCase();
    if (m.includes('cab') || m.includes('taxi')) return Car;
    if (m.includes('bus')) return Bus;
    if (m.includes('train') || m.includes('metro')) return Train;
    if (m.includes('self') || m.includes('drive')) return KeyRound;
    if (m.includes('bike') || m.includes('scooter') || m.includes('cycle')) return Bike;
    if (m.includes('flight') || m.includes('air')) return Plane;
    if (m.includes('walk')) return Footprints;
    return Car;
  };

  const IconComponent = getIcon(option.mode, option.category);

  // -------------------------------------------------------------
  // RENDER SPECIALIZED FLIGHT TICKET CARD
  // -------------------------------------------------------------
  if (isFlight) {
    const flightDetails = option.flight_details || {};
    const airlineName = option.airline || flightDetails.airline || 'Commercial Airline';
    const flightNumber = option.flight_number || flightDetails.flight_number || 'Direct Flight';
    const depTime = option.departure_time || flightDetails.departure?.time || '03:20 AM';
    const arrTime = option.arrival_time || flightDetails.arrival?.time || '08:50 AM';
    const depAirport = option.departure_airport || flightDetails.departure?.airport || option.source || 'Origin Airport';
    const arrAirport = option.arrival_airport || flightDetails.arrival?.airport || option.destination || 'Cochin International Airport (COK)';
    const cabin = option.cabin_class || flightDetails.cabin || 'Economy Class';
    const baggage = option.baggage || flightDetails.baggage || '30 kg Check-in + 7 kg Cabin Bag';
    const meal = flightDetails.meal || 'Complimentary Refreshments & Bottled Water';
    const aircraft = flightDetails.aircraft || 'Commercial Jet';

    const connectingVehicles = option.connecting_vehicles || [];
    const [selectedVehId, setSelectedVehId] = useState(
      option.selected_connecting_vehicle || (connectingVehicles[0]?.id) || 'cab_sedan'
    );

    const activeVehicle = connectingVehicles.find(v => v.id === selectedVehId) || connectingVehicles[0];
    const baseAirfareTotal = Number(option.flight_fare || (Number(option.fare || option.fare_per_person || 12000) * travelers));
    const connectingFareTotal = activeVehicle ? Number(activeVehicle.fare || 0) : Number(option.connecting_vehicle_fare || 0);
    const combinedTotalFare = baseAirfareTotal + connectingFareTotal;
    const combinedFarePerPerson = Math.round(combinedTotalFare / Math.max(1, travelers));

    const handleSelectConnectingVehicle = (veh) => {
      setSelectedVehId(veh.id);
      option.selected_connecting_vehicle = veh.id;
      option.connecting_vehicle_fare = veh.fare;
      option.total_fare = baseAirfareTotal + veh.fare;
      option.fare_per_person = Math.round((baseAirfareTotal + veh.fare) / Math.max(1, travelers));
      option.selected_vehicle_obj = veh;
      if (onSelect && isSelected) {
        onSelect(option);
      }
    };

    return (
      <>
        <div
          onClick={() => {
            option.total_fare = combinedTotalFare;
            option.fare_per_person = combinedFarePerPerson;
            option.selected_connecting_vehicle = selectedVehId;
            option.selected_vehicle_obj = activeVehicle;
            onSelect && onSelect(option);
          }}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 cursor-pointer flex flex-col justify-between space-y-4 ${
            isSelected
              ? 'bg-gradient-to-br from-[#0c2044] via-[#101b30] to-[#0d2a3f] border-cyan-400 shadow-[0_12px_35px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/60'
              : 'bg-[#101b30] border-slate-700/80 hover:border-cyan-500/60 hover:bg-[#13223d] shadow-[0_4px_20px_rgba(2,8,23,0.3)]'
          }`}
        >
          {/* Top Airline Header & Fare */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/70 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-300 shadow-md'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
              }`}>
                <Plane className="h-5 w-5 rotate-45" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base sm:text-lg text-slate-100 group-hover:text-cyan-200 tracking-tight">
                    {airlineName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-black tracking-wider uppercase">
                    {flightNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                    {cabin}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-400/50">
                      Selected Flight & Transfer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Operated by {airlineName} • {aircraft}
                </p>
              </div>
            </div>

            {/* Total Combined Airfare + Ground Transfer Display */}
            <div className="sm:text-right shrink-0 bg-[#0b1528]/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-700/50 flex sm:flex-col justify-between items-center sm:items-end">
              <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight flex items-baseline justify-end">
                <span>₹{combinedTotalFare.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold block sm:mt-0.5">
                {travelers > 1 ? `Total Flight + Resort Transfer (${travelers} pax)` : 'Total Flight + Resort Transfer'}
              </span>
            </div>
          </div>

          {/* Flight Schedule Timeline (Boarding Pass Layout) */}
          <div className="p-4 rounded-xl bg-[#0b1528]/90 border border-slate-700/80 grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
            {/* Origin Airport */}
            <div className="sm:col-span-2 space-y-0.5 text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departure</div>
              <div className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">{depTime}</div>
              <div className="text-xs font-bold text-cyan-300 line-clamp-1">{depAirport}</div>
            </div>

            {/* Flight Path Indicator */}
            <div className="sm:col-span-3 flex flex-col items-center justify-center py-1">
              <div className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700 mb-1">
                {option.duration_formatted || '3h 30m Non-Stop'}
              </div>
              <div className="w-full flex items-center justify-center space-x-2 text-cyan-400 px-4">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400 to-cyan-500/20"></div>
                <Plane className="h-4 w-4 transform rotate-90 shrink-0 text-cyan-300" />
                <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400 to-cyan-500/20"></div>
              </div>
              <div className="text-[10px] font-semibold text-emerald-400 mt-1">
                Non-Stop Direct Route
              </div>
            </div>

            {/* Destination Airport */}
            <div className="sm:col-span-2 space-y-0.5 sm:text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arrival</div>
              <div className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">{arrTime}</div>
              <div className="text-xs font-bold text-cyan-300 line-clamp-1">{arrAirport}</div>
            </div>
          </div>

          {/* STAGE 2: MULTIPLE VEHICLE SELECTION FOR AIRPORT ➔ RESORT GROUND CONNECTION */}
          {connectingVehicles.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0b1528] to-cyan-950/30 border border-emerald-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Stage 2: Select Airport ➔ Destination Transfer Vehicle
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {arrAirport.split('(')[0].trim()} ➔ Resort (~{activeVehicle?.distance_km || 95} km • {activeVehicle?.duration || '2h 45m'})
                </span>
              </div>

              {/* Interactive Vehicle Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {connectingVehicles.map((veh) => {
                  const isVehSelected = selectedVehId === veh.id;
                  return (
                    <div
                      key={veh.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectConnectingVehicle(veh);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isVehSelected
                          ? 'bg-emerald-600/25 border-emerald-400 ring-1 ring-emerald-400/60 shadow-md scale-[1.01]'
                          : 'bg-[#101b30] border-slate-700/80 hover:border-emerald-500/50 hover:bg-[#14243f]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[11px] font-black text-slate-100 block">
                            {veh.name}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                            {veh.badge}
                          </span>
                        </div>
                        {isVehSelected && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </div>

                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        {veh.description}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px]">
                        <span className="text-[9px] font-semibold text-slate-400">
                          {veh.capacity}
                        </span>
                        <span className="font-black text-emerald-300">
                          +₹{Number(veh.fare || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeVehicle && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/30 text-[11px] text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Included in Itinerary: <strong>{activeVehicle.name}</strong> (~{activeVehicle.duration})</span>
                  </span>
                  <span className="text-cyan-300 font-bold text-[10px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    Airport Meet & Greet with Nameboard Included
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Airline Badges & Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            {option.badge && (
              <RecommendationBadge badge={option.badge} />
            )}
            
            <span className="inline-flex items-center text-xs font-bold text-slate-200 bg-[#0b1528] border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-sm">
              <Luggage className="h-3.5 w-3.5 mr-1 text-cyan-400" />
              {baggage}
            </span>

            <span className="inline-flex items-center text-xs font-bold text-slate-200 bg-[#0b1528] border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-sm">
              <Utensils className="h-3.5 w-3.5 mr-1 text-amber-400" />
              {meal}
            </span>

            <span className="inline-flex items-center text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-lg shadow-sm">
              ₹{combinedFarePerPerson.toLocaleString()} / seat (Flight + Cab)
            </span>
          </div>

          {/* AI Reasoning */}
          {option.personalized_reason && (
            <div className="p-3.5 rounded-xl bg-[#0b1528] border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong className="text-cyan-300 font-bold">AI Flight Insight: </strong>
                {option.personalized_reason}
              </p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3.5 border-t border-slate-700/60 mt-2 gap-3 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBreakdown(true);
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-amber-400" />
              <span>Airfare & Cab Breakdown</span>
            </button>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {onShowOnMap && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowOnMap(option);
                  }}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-xl transition-all px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  <span>View Flight Path</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  option.total_fare = combinedTotalFare;
                  option.fare_per_person = combinedFarePerPerson;
                  option.selected_connecting_vehicle = selectedVehId;
                  option.selected_vehicle_obj = activeVehicle;
                  onSelect && onSelect(option);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'bg-[#0b1528] hover:bg-cyan-600/20 text-slate-200 border border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                {isSelected ? '✓ Selected Flight & Cab' : 'Select Flight & Cab'}
              </button>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Modal */}
        <CostBreakdown
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          option={{
            ...option,
            total_fare: combinedTotalFare,
            fare_per_person: combinedFarePerPerson,
            selected_connecting_vehicle_obj: activeVehicle,
            cost_breakdown: {
              title: `${airlineName} (${flightNumber}) + ${activeVehicle?.name || 'Resort Cab'} Breakdown`,
              flight_fare: baseAirfareTotal,
              connecting_vehicle_fare: connectingFareTotal,
              total_fare: combinedTotalFare,
              travelers: travelers,
              formula: `Flight Airfare (₹${baseAirfareTotal.toLocaleString()} for ${travelers} pax) + Connecting Ground Transfer (${activeVehicle?.name || 'Cab'}: ₹${connectingFareTotal.toLocaleString()}) = ₹${combinedTotalFare.toLocaleString()} Total`,
              transit_disclaimer: `Includes scheduled airline flight tickets to ${arrAirport}, customs clearance window, and pre-booked private ${activeVehicle?.name || 'resort cab'} directly up to your destination.`
            }
          }}
          routeInfo={{ distance_km: distanceKm, travelers }}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // RENDER STANDARD GROUND / RAIL / CYCLE CARD
  // -------------------------------------------------------------
  return (
    <>
      <div
        onClick={() => onSelect && onSelect(option)}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 cursor-pointer flex flex-col justify-between space-y-4 ${
          isSelected
            ? 'bg-gradient-to-br from-blue-950/80 via-[#101b30] to-cyan-950/50 border-cyan-400 shadow-[0_10px_30px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
            : 'bg-[#101b30] border-slate-700/70 hover:border-slate-500 hover:bg-[#13223d] shadow-[0_4px_20px_rgba(2,8,23,0.25)]'
        }`}
      >
        {/* Top Section: Icon + Mode Title + Origin/Destination + Big Total Fare */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            {/* Left side: Icon + Full Title & Route */}
            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
              <div className={`p-3 rounded-2xl border shrink-0 transition-colors ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-[#0b1528] text-cyan-400 border-slate-700/80 group-hover:border-cyan-500/50'
              }`}>
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-black text-base sm:text-lg text-slate-100 group-hover:text-cyan-200 transition-colors tracking-tight leading-snug">
                    {option.transport_type}
                  </h4>
                  {isSelected && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/40 shadow-sm shrink-0">
                      Selected
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-200 font-semibold">{option.source}</span>
                  <span className="text-cyan-400 font-bold">➔</span>
                  <span className="text-slate-200 font-semibold">{option.destination}</span>
                </p>
              </div>
            </div>

            {/* Right side: Prominent Total Fare */}
            <div className="sm:text-right shrink-0 bg-[#0b1528]/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-700/50 flex sm:flex-col justify-between items-center sm:items-end">
              <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight flex items-baseline justify-end">
                <span>₹{Number(option.total_fare || 0).toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold block sm:mt-0.5">
                {travelers > 1 ? `Total (${travelers} pax)` : 'Total fare'}
              </span>
            </div>
          </div>

          {/* Badge & Quick Metric Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {option.badge && (
              <RecommendationBadge badge={option.badge} />
            )}
            
            <span className="inline-flex items-center text-xs font-bold text-slate-200 bg-[#0b1528] border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-sm">
              <Clock className="h-3.5 w-3.5 mr-1 text-cyan-400" />
              {option.duration_formatted || '2-3 Hours'}
            </span>

            <span className="inline-flex items-center text-xs font-bold text-slate-200 bg-[#0b1528] border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-sm">
              🛣️ {option.distance_km || distanceKm} km
            </span>

            {option.fare_per_person !== undefined && (
              <span className="inline-flex items-center text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-lg shadow-sm">
                ₹{Number(option.fare_per_person).toLocaleString()} / person
              </span>
            )}

            {option.cost_per_km !== undefined && option.cost_per_km > 0 && (
              <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-[#0b1528] border border-slate-700/70 px-2.5 py-1 rounded-lg shadow-sm">
                ₹{Number(option.cost_per_km).toFixed(2)}/km
              </span>
            )}
          </div>

          {/* AI or Personalized Recommendation Reasoning */}
          {option.personalized_reason && (
            <div className="p-3.5 rounded-xl bg-[#0b1528] border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-cyan-300 font-bold">Why recommended: </strong>
                {option.personalized_reason}
              </p>
            </div>
          )}

          {/* Amenities Chips */}
          {option.amenities && option.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {option.amenities.slice(0, 4).map((amenity, aIdx) => (
                <span key={aIdx} className="text-[10px] font-semibold text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700/70">
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-700/60 mt-2 gap-3 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBreakdown(true);
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="View transparent tariff calculation"
          >
            <Info className="h-3.5 w-3.5 text-amber-400" />
            <span>{option.price_label || 'Cost Breakdown'}</span>
          </button>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onShowOnMap && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowOnMap(option);
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-xl transition-all px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Focus and view route on the interactive map"
              >
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                <span>View on Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(option);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'bg-[#0b1528] hover:bg-cyan-600/20 text-slate-200 border border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Calculation Popup */}
      <CostBreakdown
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        option={option}
        routeInfo={{ distance_km: distanceKm, travelers }}
      />
    </>
  );
}
