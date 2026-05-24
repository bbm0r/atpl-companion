/**
 * Generates synthetic ATPL study material PDFs for testing the RAG pipeline.
 * Content is representative of real ATPL exam topics but entirely original.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const PDF_DIR = path.join(process.cwd(), "pdfs");
fs.mkdirSync(PDF_DIR, { recursive: true });

// ── Content ──────────────────────────────────────────────────────────────────

const subjects: Record<string, string[]> = {
  "ATPL-Meteorology": [
    `CHAPTER 1: THE ATMOSPHERE

The atmosphere is a layer of gases surrounding the Earth, held in place by gravity. It extends from the surface to approximately 1000 km altitude, though 99% of its mass lies below 32 km.

The standard atmosphere is defined by ICAO as follows: sea-level temperature of 15°C (288.15 K), sea-level pressure of 1013.25 hPa, and a temperature lapse rate of 6.5°C per 1000 m (approximately 2°C per 1000 ft) up to the tropopause.

The atmosphere is divided into layers based on temperature gradient:
- Troposphere: surface to approximately 11 km (36,089 ft) at mid-latitudes. Temperature decreases at 6.5°C/1000 m. Contains 75% of atmospheric mass and virtually all weather phenomena.
- Tropopause: the boundary between troposphere and stratosphere. Temperature at the tropopause is approximately -56.5°C (-69.7°F) in the standard atmosphere.
- Stratosphere: 11 km to 50 km. Temperature initially constant then increases with altitude due to ozone absorption of UV radiation.
- Mesosphere: 50 km to 80 km. Temperature decreases with altitude.
- Thermosphere: above 80 km. Temperature increases significantly.

The tropopause height varies with latitude and season:
- Equatorial regions: approximately 16–18 km (52,000–59,000 ft)
- Mid-latitudes: approximately 11 km (36,000 ft)
- Polar regions: approximately 8 km (26,000 ft)
- Higher in summer, lower in winter at mid-latitudes

Temperature variations in the troposphere determine atmospheric stability, which governs the development of clouds and precipitation.`,

    `CHAPTER 2: ATMOSPHERIC PRESSURE AND ALTIMETRY

Atmospheric pressure is the force per unit area exerted by the weight of air above a given point. At sea level in the standard atmosphere, pressure is 1013.25 hPa (29.92 inHg or 760 mmHg).

Pressure decreases with altitude. The relationship is approximately:
- Every 27 ft (8.25 m) of altitude gain at sea level corresponds to a 1 hPa pressure drop.
- This rate increases with altitude as air density decreases.
- At FL180 (18,000 ft), pressure is approximately 506 hPa.
- At FL350 (35,000 ft), pressure is approximately 238 hPa.

Altimeter settings:
- QNH: the altimeter setting that causes the instrument to read field elevation when on the ground at that aerodrome. Used below the transition altitude for terrain clearance.
- QFE: the altimeter setting that causes the instrument to read zero when on the ground at the aerodrome reference point.
- Standard setting (1013.25 hPa / 29.92 inHg): used above the transition altitude (in Europe typically FL60–FL100 depending on state). All aircraft above the transition level fly at flight levels.
- QNE: the altitude indicated when 1013.25 hPa is set; equivalent to the flight level reading.

Transition altitude: the altitude at or below which QNH is used. Set by the state.
Transition level: the lowest available flight level above the transition altitude. Set by ATC.
Transition layer: the airspace between transition altitude and transition level.

Altimeter errors:
- Temperature error: the altimeter assumes standard temperature. In cold air, true altitude is LOWER than indicated (the aircraft is lower than the altimeter reads). Correction: add 4 ft per 1000 ft height above station per degree below standard temperature.
- Pressure error (subscale error): incorrect altimeter setting.
- Instrument error: mechanical imperfections.
- Time lag: the instrument takes time to respond to rapid pressure changes.`,

    `CHAPTER 3: WIND AND ATMOSPHERIC CIRCULATION

Wind is defined as air movement relative to the Earth's surface, described by its direction (from which it blows) and speed.

The primary driver of atmospheric circulation is the differential solar heating between equatorial and polar regions. This creates three major circulation cells in each hemisphere:
- Hadley cell: equator to approximately 30° latitude
- Ferrel cell: 30° to 60° latitude
- Polar cell: 60° to 90° latitude

The Coriolis force deflects moving air to the right in the Northern Hemisphere and to the left in the Southern Hemisphere. It is zero at the equator and maximum at the poles.

Geostrophic wind: the theoretical wind that results from a balance between the pressure gradient force and the Coriolis force. It blows parallel to the isobars. Geostrophic wind speed = pressure gradient / (2 × omega × sin(latitude) × air density).

Buys-Ballot's Law: stand with your back to the wind in the Northern Hemisphere; low pressure is to your left and slightly in front, high pressure to your right.

Surface wind vs. gradient wind: friction near the surface slows the wind and veers it (backs it in the Southern Hemisphere) toward lower pressure. At 2000 ft AGL, the wind is approximately geostrophic.

Jet streams: narrow bands of high-speed winds at tropopause level.
- Polar front jet stream: typically at 300–200 hPa (30,000–40,000 ft), speed 80–300 kt, latitude 35°–65°.
- Subtropical jet stream: typically at 200–150 hPa (40,000–50,000 ft), latitude 20°–30°.
- Jet streams meander in a wave pattern (Rossby waves). The core velocity can reach 300 kt.

Clear Air Turbulence (CAT): severe turbulence in cloudless air, typically associated with jet streams. Most common on the polar side of the jet core and below the jet axis. Wind shear exceeds 4–5 kt/1000 ft vertically or 10 kt/60 NM horizontally.`,

    `CHAPTER 4: CLOUDS AND PRECIPITATION

Clouds form when moist air cools to its dew point temperature and condensation occurs on condensation nuclei (dust, smoke, sea salt particles).

Cloud classification (WMO/ICAO):
High clouds (above 20,000 ft in mid-latitudes):
- Cirrus (Ci): thin, wispy ice crystal clouds. No precipitation.
- Cirrocumulus (Cc): small white puffs in rows. Rare.
- Cirrostratus (Cs): thin ice crystal sheet. Produces halo phenomena (22° halo). Sun and moon visible.

Middle clouds (6,500–20,000 ft):
- Altocumulus (Ac): white or grey patches. Castellanus variety indicates instability.
- Altostratus (As): grey or blue-grey sheet. Produces widespread precipitation. Sun appears as through ground glass.

Low clouds (surface to 6,500 ft):
- Stratus (St): uniform grey layer. Drizzle. Lowest type of cloud.
- Stratocumulus (Sc): most common cloud type globally. Grey or white patches/rolls.
- Nimbostratus (Ns): dark grey layer producing continuous rain or snow. Base often indistinct.

Clouds with vertical development:
- Cumulus (Cu): heaped clouds with flat bases. Fair weather Cu: less than 1 km depth. Growing Cu: 1–3 km. Towering Cu (TCu): 3–8 km.
- Cumulonimbus (Cb): the most dangerous cloud for aviation. Top may reach the tropopause (anvil head). Contains: severe turbulence, icing, lightning, hail, wind shear, microburst, tornadoes. Pilot weather report (PIREP) required.

Precipitation types:
- Drizzle: droplets < 0.5 mm diameter, from stratus or fog.
- Rain: droplets > 0.5 mm diameter.
- Snow: ice crystals below 0°C.
- Hail: ice pellets from Cb clouds. Serious engine and airframe hazard.
- Freezing rain/drizzle: supercooled liquid water that freezes on contact with aircraft surfaces. Most severe icing hazard.`,

    `CHAPTER 5: ICING

Aircraft icing occurs when supercooled water droplets (water below 0°C that hasn't frozen) contact the aircraft and freeze on impact. Icing is most severe at temperatures between 0°C and -20°C. Below -40°C, water is almost entirely in ice crystal form and icing risk is low.

Types of ice:
- Clear (glaze) ice: forms between 0°C and -10°C. Large supercooled droplets. Transparent, heavy, hard to remove. Rapid accumulation. Most dangerous.
- Rime ice: forms between -10°C and -20°C. Small droplets freeze instantly. White, brittle, rough surface. Traps air. Less dense than clear ice.
- Mixed ice: combination of clear and rime. Irregular shape.
- Frost: deposition of water vapour directly as ice crystals on surfaces at or below 0°C. Disrupts laminar airflow even in thin layers. Aircraft must be de-iced before flight.

Effects of icing on aircraft:
- Increased drag (significant even with thin ice)
- Reduced lift (up to 30% with severe icing)
- Increased stall speed
- Increased weight
- Control surface jamming
- Engine performance reduction (induction icing)
- Antenna damage
- Pitot/static system blockage

Icing intensity definitions (ICAO):
- Trace: barely perceptible accumulation. Not a hazard unless encountered for more than 1 hour.
- Light: accumulation rate requires occasional use of de-icing systems.
- Moderate: accumulation rate requires frequent use of de-icing systems. Can become hazardous.
- Severe: accumulation rate such that de-icing/anti-icing systems fail to reduce or control the hazard.

Anti-icing vs. de-icing:
- Anti-icing: prevents ice formation (boots inflated before icing, heated surfaces, fluid systems).
- De-icing: removes ice after it forms (boots inflated after accumulation).`,
  ],

  "ATPL-Principles-of-Flight": [
    `CHAPTER 1: BASIC AERODYNAMICS

Lift is generated by a pressure difference between the upper and lower surfaces of an aerofoil. According to Bernoulli's theorem, total pressure (static + dynamic) remains constant in a streamline flow: P_static + ½ρV² = constant. Air accelerating over the curved upper surface generates lower static pressure, while slower-moving air beneath has higher static pressure.

The lift equation: L = CL × ½ × ρ × V² × S
Where: CL = coefficient of lift, ρ = air density, V = true airspeed, S = wing area.

The drag equation: D = CD × ½ × ρ × V² × S
Where CD = coefficient of drag.

The lift/drag ratio (L/D) is a measure of aerodynamic efficiency. Maximum L/D ratio (best glide ratio) occurs at a specific angle of attack regardless of weight. For a typical transport aircraft, best L/D is approximately 14:1 to 18:1.

Angle of attack (AoA): the angle between the chord line of the aerofoil and the relative airflow (relative wind). Not the same as pitch attitude.

Stall: occurs when the critical (stalling) angle of attack is exceeded, typically 15°–20°. The airflow separates from the upper surface, causing a dramatic reduction in lift and increase in drag. Stall speed increases with:
- Increased weight
- Increased load factor (g)
- Forward CG (increases required AoA for level flight—wait, actually aft CG increases stall speed... let me reconsider)
- Reduced flap extension

Stall speed relationship: VS(new) = VS(ref) × √(Weight_new / Weight_ref) × √(Load_factor)

At 60° bank angle, load factor = 2g, so stall speed increases by √2 = 41%.`,

    `CHAPTER 2: DRAG AND PERFORMANCE

Total drag = Induced drag + Profile drag (parasite drag)

Induced drag: generated as a by-product of lift production. Caused by wingtip vortices creating downwash. CD_induced = CL² / (π × AR × e), where AR = aspect ratio, e = Oswald efficiency factor (typically 0.7–0.9).
- Increases with increased lift (higher AoA, higher weight, lower speed)
- Decreases with higher speed (lower AoA needed for same lift)
- Reduced by high aspect ratio wings, winglets, elliptical lift distribution

Profile (parasite) drag: form drag + skin friction drag + interference drag. Increases with V².

Minimum drag speed (VIMD): the speed at which total drag is minimum = induced drag equals profile drag.
- VIMD is the speed for maximum L/D ratio and best glide (power off).
- In jet aircraft, VIMD ≈ long-range cruise speed.
- Minimum power speed (VIMP) is lower than VIMD (approximately VIMD × 0.76).
- VIMP gives maximum endurance for jet aircraft and maximum range for piston aircraft.

Power required vs. power available:
- Power required = Drag × TAS
- For jets: thrust required = drag. Minimum thrust required occurs at VIMD.
- Maximum range (jet): fly at minimum drag speed (VIMD) at altitude (as altitude increases, TAS increases for same IAS, so range improves).
- Maximum endurance (jet): fly at minimum fuel flow, which occurs at minimum drag speed at low altitude.

Effect of altitude on performance:
- As altitude increases: TAS increases for same IAS, drag remains the same (for same IAS), thrust decreases, fuel flow decreases.
- Turbofan thrust decreases approximately proportional to density ratio (σ = ρ/ρ₀).`,

    `CHAPTER 3: STABILITY AND CONTROL

Static stability: the initial tendency of an aircraft to return to equilibrium after a disturbance.
- Positive static stability: returns to original position (stable).
- Neutral static stability: remains in displaced position.
- Negative static stability: diverges from original position (unstable).

Longitudinal (pitch) stability:
- The horizontal stabiliser provides a downward aerodynamic force to balance the nose-heavy pitching moment of the wing.
- Centre of gravity (CG) must be ahead of the neutral point (aerodynamic centre of the entire aircraft).
- As CG moves aft, stability decreases. At the aft CG limit, minimum acceptable stability is maintained.
- Forward CG: more stable but higher stick forces, higher trim drag, higher stall speed.
- Aft CG: less stable, lower stick forces, lower stall speed, more efficient (less trim drag).

Lateral stability (roll):
- Dihedral effect: wing dihedral provides roll stability. A sideslip generates a restoring roll moment.
- Sweep-back provides effective dihedral.
- High-wing configuration provides more lateral stability than low-wing (pendulum effect).

Directional stability (yaw): provided by the vertical stabiliser (fin). Acts like an arrow's fletching.

Dynamic stability: the behaviour of oscillations over time.
- Phugoid oscillation: long-period pitch oscillation (period ~100 seconds). Altitude and speed vary out of phase. Typically lightly damped. Aircraft speed and altitude oscillate while AoA remains nearly constant.
- Short-period oscillation: rapid pitch oscillation. Must be heavily damped. Pilot should not attempt to control phugoid with pitch inputs — will aggravate short-period mode.
- Dutch roll: combined yaw and roll oscillation. Typical of swept-wing aircraft. Yaw dampers fitted to suppress.
- Spiral divergence: one wing drops, aircraft enters gentle spiral that steepens if uncorrected. Slow to develop.`,

    `CHAPTER 4: HIGH-SPEED AERODYNAMICS

As aircraft speed approaches the speed of sound, compressibility effects become significant.

Speed of sound: a = √(γRT), where γ = 1.4, R = 287 J/(kg·K), T = absolute temperature.
At ISA sea level: a = 340.3 m/s = 661.5 kt
At FL350 (-54.3°C = 218.85 K): a = √(1.4 × 287 × 218.85) = 296.5 m/s = 576.5 kt

Mach number: M = TAS / local speed of sound. Varies with temperature (altitude).

Critical Mach number (MCRIT): the freestream Mach number at which airflow over the wing first reaches Mach 1.0 locally. Typically 0.72–0.82 for modern transport aircraft.

Above MCRIT: shock waves form on the wing. Effects include:
- Wave drag: significant increase in total drag (drag divergence).
- Buffet: airflow separation behind shock wave causes airframe buffet.
- Mach tuck (tuck-under): loss of downwash behind shock, horizontal stabiliser becomes less effective, nose pitches down. Aircraft automatically pitches nose-down at high Mach numbers.
- Control reversal possible on unswept wings (aeroelastic effect).

Coffin corner (Q corner): the altitude at which the low-speed buffet boundary (stall) and high-speed buffet boundary (Mach buffet) converge. The margin between the two speeds reduces with altitude. Above the coffin corner, no speed exists at which level flight is possible.

Swept wings: sweeping the wing back raises MCRIT because the component of velocity perpendicular to the leading edge is reduced. Sweep angle θ gives effective velocity = V × cos(θ). However, sweep reduces CLmax and worsens low-speed handling.

Area rule (Whitcomb): to minimise wave drag, the cross-sectional area of the aircraft should vary smoothly (Sears-Haack body). Fuselage is "waisted" at the wing junction.`,
  ],

  "ATPL-Navigation": [
    `CHAPTER 1: EARTH AND COORDINATES

The Earth is an oblate spheroid — slightly flattened at the poles. For most navigation purposes it is treated as a sphere with mean radius 6,371 km (3,440 NM).

Great circle: the intersection of the Earth's surface with a plane passing through the centre of the Earth. The shortest distance between two points on the Earth's surface lies along a great circle. The equator and all meridians are great circles.

Small circle: the intersection of the Earth's surface with a plane that does NOT pass through the Earth's centre. Parallels of latitude (except the equator) are small circles.

Rhumb line: a line that crosses all meridians at the same angle. It appears as a straight line on a Mercator chart. The rhumb line track is constant but it is NOT the shortest route (except along the equator or a meridian). The great circle is shorter for E-W routes at high latitudes — the difference can be significant.

Coordinates:
- Latitude: angular distance N or S of the equator. 0° at equator, 90° at poles. 1° = 60 NM. 1 NM = 1 minute of latitude.
- Longitude: angular distance E or W of the prime meridian (Greenwich). 0° to 180° E or W.
- 1 NM = 1 minute of arc of a great circle. 1 degree of longitude at the equator = 60 NM; at latitude φ: distance = 60 × cos(φ) NM.

Convergency: the angle between two meridians at a given latitude. Convergency = change in longitude × sin(latitude). At the equator, convergency = 0 (meridians are parallel). At the poles, convergency = change in longitude.

Conversion angle: half the convergency. Used to convert between great circle and rhumb line tracks. GC track = RL track ± conversion angle (GC track is always closer to the pole than RL track).`,

    `CHAPTER 2: MAGNETIC VARIATION AND COMPASS ERRORS

True north: direction of the geographic North Pole.
Magnetic north: direction of the Earth's magnetic North Pole. The magnetic pole moves slowly over time.

Variation (declination): the angle between true north and magnetic north at a given location. Isogonals are lines of equal variation. The agonic line has zero variation.
- Variation West: magnetic compass reads higher than true (add westerly variation to magnetic to get true). Mnemonic: VARIATION WEST MAGNETIC BEST (magnetic track > true track).
- Variation East: magnetic compass reads lower than true. VARIATION EAST MAGNETIC LEAST.
Formula: True = Magnetic + Variation (positive E, negative W). Or: Magnetic = True − Variation.

Deviation: the error in the compass caused by the aircraft's own magnetic field. Plotted on a deviation card for each aircraft.
Compass heading = Magnetic heading + Deviation (positive E, negative W).

Compass errors:
- Turning error: most significant near the poles. In the Northern Hemisphere:
  * Turning through south: the compass LEADS the turn.
  * Turning through north: the compass LAGS the turn.
  * Rule: UNOS (Undershoot North, Overshoot South).
  * Acceleration error: on E or W headings, acceleration causes the compass to indicate a turn to north (Northern Hemisphere). Deceleration causes indication of turn to south. Mnemonic: ANDS (Accelerate North, Decelerate South).

Gyroscopic instruments:
- Directional gyro (heading indicator): rigid in space, so drifts relative to rotating Earth. Must be aligned with compass periodically. Gyroscopic rigidity and precession are the two fundamental properties.
- Earth rate: the apparent drift of the gyro due to Earth's rotation. 15°/hour at the equator, 0 at the poles (15 × sin latitude for transport rate, 15 × cos latitude for real wander rate).`,

    `CHAPTER 3: RADIO NAVIGATION AIDS

VOR (VHF Omnidirectional Range):
- Operates 108.0–117.95 MHz (even tenths 108.0–111.95 MHz shared with ILS).
- Provides magnetic bearing FROM the station. Line-of-sight range.
- Accuracy: ±2° (ICAO specification).
- DVOR (Doppler VOR): more accurate, less affected by terrain reflections.
- VOR radials are magnetic bearings FROM the station. To fly TO the station on radial 270, set OBS to 090 with TO indication.
- Service volumes: Terminal VOR (TVOR): 25 NM radius to FL40; Low-altitude VOR: 40 NM to FL18; High-altitude VOR (HVOR): 40 NM FL18 to FL45, 100 NM FL45 to FL60, 130 NM FL60+.

DME (Distance Measuring Equipment):
- Operates 960–1215 MHz (UHF).
- Measures slant range (not ground distance). At altitude h (ft) and ground distance d (NM): slant range = √(d² + (h/6080)²).
- Co-located with VOR (VORDME) or ILS (ILSDME).
- Accuracy: ±0.5 NM or 3% of range, whichever is greater.

ILS (Instrument Landing System):
- Localiser: provides lateral guidance. 108.10–111.95 MHz (odd tenths). Width ±2.5° (200 ft wide at threshold). Course width adjustable 3°–6° to give 700 ft width at threshold.
- Glidepath: provides vertical guidance. 329–335 MHz. Typically 3° (range 2°–4°). Width ±0.7° (approximately 50 ft at threshold).
- Marker beacons: 75 MHz. Outer marker (OM): 4–7 NM from threshold, blue light, 400 Hz tone (2 dashes/sec). Middle marker (MM): 3,500 ft from threshold, amber light, 1300 Hz tone (alternate dots and dashes). Inner marker (IM): at the threshold, white light, 3000 Hz tone (6 dots/sec).
- ILS categories: CAT I: DH 200 ft, RVR 550 m. CAT II: DH 100 ft, RVR 350 m. CAT III A: DH <100 ft, RVR 200 m. CAT III B: DH <50 ft, RVR 75 m. CAT III C: no DH, no RVR limit.`,

    `CHAPTER 4: GPS AND GNSS

GPS (Global Positioning System): a satellite-based navigation system operated by the US Department of Defense.

Constellation: 24+ satellites in 6 orbital planes at 20,200 km altitude. Orbital period approximately 12 hours. At least 4 satellites visible from any point on Earth at any time.

Position calculation: the receiver measures pseudoranges to 4 or more satellites using the time of signal transmission. Three satellites give a 3D position fix; the 4th satellite is used to correct receiver clock errors.

Accuracy: standalone GPS: 10–15 m (95th percentile). WAAS/EGNOS augmented: 1–3 m.

RAIM (Receiver Autonomous Integrity Monitoring): detects satellite failures by checking consistency of multiple satellite signals. Requires at least 5 satellites for detection, 6 for exclusion. Must be verified before departure for instrument approaches.

GNSS (Global Navigation Satellite System): generic term for satellite navigation systems.
- GPS: USA (fully operational)
- GLONASS: Russia (fully operational)
- Galileo: European Union (operational)
- BeiDou: China (operational)

SBAS (Satellite-Based Augmentation System): ground stations monitor GNSS signals and broadcast corrections via geostationary satellites. Provides improved accuracy and integrity.
- WAAS: North America
- EGNOS: Europe
- MSAS: Japan
- GAGAN: India

RNP (Required Navigation Performance): navigation specification that includes onboard monitoring and alerting capability. Aircraft must be able to monitor its own navigation accuracy.
- RNP 1: lateral accuracy ±1 NM (95%), containment 2 NM.
- RNP APCH: ±0.3 NM on final approach.
- RNP AR APCH: down to ±0.1 NM, allows curved approaches.`,
  ],

  "ATPL-Air-Law": [
    `CHAPTER 1: ICAO AND THE CHICAGO CONVENTION

The Convention on International Civil Aviation (Chicago Convention), signed on 7 December 1944, established the International Civil Aviation Organisation (ICAO) and the fundamental principles governing international air transport.

Key provisions of the Chicago Convention:
- Article 1: States have complete and exclusive sovereignty over the airspace above their territory.
- Article 3: Convention applies to civil aircraft only (not state aircraft — military, customs, police).
- Article 5: Non-scheduled flights over or into contracting states permitted without prior permission, subject to overflight and landing rights.
- Article 6: Scheduled international air services require specific permission from the state overflown.
- Article 12: Each state shall keep its rules of the air consistent with ICAO Standards. Over the high seas, ICAO rules apply.
- Article 29: Aircraft engaged in international navigation shall carry: certificate of registration, certificate of airworthiness, appropriate licences for each crew member, journey logbook, radio station licence, passenger manifest and cargo manifest if applicable.
- Article 32: Crew licences must be recognised by the state overflown.

ICAO Annexes to the Convention (18 annexes):
- Annex 1: Personnel Licensing
- Annex 2: Rules of the Air
- Annex 6: Operation of Aircraft (Part I: International Commercial Air Transport — Aeroplanes)
- Annex 8: Airworthiness of Aircraft
- Annex 10: Aeronautical Telecommunications
- Annex 11: Air Traffic Services
- Annex 14: Aerodromes
- Annex 15: Aeronautical Information Services
- Annex 18: The Safe Transport of Dangerous Goods by Air

Standards and Recommended Practices (SARPs): ICAO issues Standards (mandatory for member states) and Recommended Practices (desirable). States must notify ICAO of any differences from Standards.`,

    `CHAPTER 2: AIRSPACE CLASSIFICATION AND ATC

ICAO airspace classification (Classes A through G):

Class A: IFR flights only. All flights subject to ATC service. All flights separated from each other. Continuous two-way radio contact required. Speed: no limitation above FL290.

Class B: IFR and VFR. All flights separated from each other. Two-way radio. ATC clearance required.

Class C: IFR and VFR. IFR separated from IFR and VFR. VFR separated from IFR, traffic information for VFR/VFR. Two-way radio. ATC clearance required.

Class D: IFR and VFR. IFR separated from IFR. Traffic information for IFR against VFR and VFR against IFR and VFR (when requested). Two-way radio. ATC clearance required.

Class E: IFR and VFR. IFR separated from IFR. Traffic information as far as practical. Two-way radio for IFR. ATC clearance for IFR. VFR no clearance required but recommended radio contact.

Class F: IFR and VFR. IFR separated from IFR as far as practical (advisory service). Traffic information as far as practical. Two-way radio recommended. No clearance required.

Class G: IFR and VFR. No separation. Flight information service if requested. Two-way radio for IFR. No clearance required.

Altimeter setting procedures:
- Below transition altitude: set QNH (local or destination). Fly altitudes.
- Above transition level: set 1013.25 hPa. Fly flight levels.
- Transition altitude and level determined by state. In Europe typically 3000–6000 ft AMSL and FL55–FL75.

RVSM (Reduced Vertical Separation Minima): above FL290, vertical separation reduced from 2000 ft to 1000 ft. Requires RVSM-approved aircraft (accurate altimetry ±60 ft).`,

    `CHAPTER 3: FLIGHT CREW LICENSING (ICAO ANNEX 1)

ATPL (Airline Transport Pilot Licence) — Aeroplane:
Minimum requirements (ICAO):
- Age: minimum 21 years.
- Medical: Class 1 medical certificate.
- Flight time: total 1500 hours, including:
  * 500 hours cross-country flight time.
  * 200 hours night flying.
  * 75 hours instrument flight time (not more than 30 hours simulated).
  * 250 hours as PIC or 250 hours as PIC under supervision (PICUS).

Privileges of ATPL holder:
- Act as PIC or co-pilot of any aeroplane on operations requiring an ATPL.
- Act as PIC of multi-crew aeroplanes.

CPL (Commercial Pilot Licence) — Aeroplane:
- Age: minimum 18 years.
- Medical: Class 1.
- Flight time: 250 hours total.
- Privileges: act as PIC on single-pilot commercial operations; as co-pilot on multi-crew aeroplanes (with IR).

Medical certificates:
- Class 1: required for CPL and ATPL holders acting as required crew members.
- Class 2: required for PPL holders.
- Class 1 validity: initial, valid 12 months (6 months after age 40 for single-pilot commercial transport; 6 months after age 60 for multi-pilot operations for some authorities).

Recency requirements:
- Night takeoff and landing currency: typically 3 takeoffs and landings at night within the preceding 90 days.
- IFR currency: instrument approaches, holding, and procedures — typically 6 IFR approaches within preceding 6 months.`,

    `CHAPTER 4: RULES OF THE AIR (ICAO ANNEX 2)

Right-of-way rules (Rule of the Air):
1. Distress: aircraft in distress have right-of-way over all others.
2. Balloons over airships over gliders over aeroplanes over powered aircraft.
3. Converging aircraft at same altitude: aircraft on the right has right of way. Each gives way to the right.
4. Head-on: both alter course to the right.
5. Overtaking: overtaking aircraft gives way. Overtaking means within 70° of the other aircraft's tail. Pass to the right.
6. Landing: aircraft on final approach or landing has right of way over aircraft in flight or on ground.
7. Lower aircraft on approach has right of way when two aircraft are approaching to land.

Altitude and cruising levels:
- VFR flights: 1000 ft (500 ft in some states) below clouds, 2000 ft horizontal. Above FL100: 1000 ft above clouds. IMC: clear of cloud.
- Cruise levels (semi-circular rule): magnetic track 000°–179°: odd thousands (e.g., FL070, FL090, FL110...) + 500 ft if above FL290 in RVSM. Magnetic track 180°–359°: even thousands (e.g., FL080, FL100...).
- Note: in some regions (NAT, PACOTS) other rules apply.

Visual Meteorological Conditions (VMC) minima (ICAO):
- At and above 3000 ft AMSL or 1000 ft AGL (whichever is higher):
  * Visibility: 8 km (5 km below FL100)
  * Cloud: 1500 m horizontal, 1000 ft vertical
- Below 3000 ft AMSL and 1000 ft AGL:
  * Visibility: 5 km (1500 m in some Class F and G)
  * Cloud: clear of cloud and in sight of surface

Minimum safe altitude (ICAO Annex 2):
- Over congested areas of cities: 1000 ft above highest obstacle within 8 km of the aircraft.
- Elsewhere: 500 ft above highest obstacle within 150 m (500 ft) of the aircraft.`,
  ],

  "ATPL-Human-Performance": [
    `CHAPTER 1: HUMAN FACTORS AND CRM

Human Factors (HF) is the scientific discipline concerned with understanding the interactions between humans and other elements of a system, applied to optimise human wellbeing and overall system performance.

The SHELL model (Edwards/Hawkins):
- Software (S): rules, procedures, checklists, manuals.
- Hardware (H): aircraft, controls, displays, seating.
- Environment (E): physical environment (noise, temperature, vibration), organisational environment.
- Liveware (L): the human — pilot, crew, ATC, maintenance.
Interactions: L-S (human-software), L-H (human-hardware), L-E (human-environment), L-L (human-human). Most accidents occur at the L interface.

James Reason's Swiss Cheese Model: accidents result from the alignment of holes in multiple defence layers (latent failures + active failures). Latent failures: organisational factors, procedures, design. Active failures: errors and violations by front-line operators.

Types of human error:
- Slips: correct intention, wrong execution (attention failure). Example: selecting wrong switch.
- Lapses: memory failure. Example: forgetting a checklist item.
- Mistakes: wrong plan (knowledge or rule-based failure). Example: incorrect descent calculation.
- Violations: deliberate deviations from rules. Routine violations: normalised deviance. Exceptional violations: unusual circumstances.

CRM (Crew Resource Management): the effective use of all available resources — people, information, equipment — to achieve safe and efficient flight operations.

CRM skills:
- Communication: assertiveness, active listening, briefing.
- Situational awareness (SA): knowing what is happening now and predicting what will happen next. Endsley's 3 levels: perception, comprehension, projection.
- Decision making: recognition-primed decision (RPD), analytical decision making. FORDEC model: Facts, Options, Risks, Decision, Execution, Check.
- Leadership and teamwork.
- Workload management and task prioritisation: Aviate-Navigate-Communicate hierarchy.`,

    `CHAPTER 2: PHYSIOLOGY — HYPOXIA AND THE ATMOSPHERE

Hypoxia: a state of oxygen deficiency in the body tissues sufficient to cause impairment.

Partial pressure of oxygen: at sea level, atmospheric pressure is 1013.25 hPa, oxygen is 20.9% of the atmosphere. Partial pressure of O₂ = 0.209 × 1013.25 = 212 hPa. At altitude, the percentage remains the same but total pressure falls, so partial pressure of O₂ falls.

Altitude physiology:
- At 8,000 ft (2,440 m): mild hypoxia begins. Slight impairment of night vision. Cabin pressure limit for commercial aircraft (typically maintained below 8,000 ft equivalent).
- At 10,000 ft: increased respiration, headache in some individuals. FAR/EASA require supplemental oxygen for crew after 30 minutes above 10,000 ft.
- At 14,000–16,000 ft: significant impairment. Euphoria, impaired judgement, loss of self-critical ability.
- At 18,000–22,000 ft: Time of Useful Consciousness (TUC) approximately 20–30 minutes.
- At 25,000 ft: TUC approximately 3–5 minutes.
- At 30,000 ft: TUC approximately 1–2 minutes (with no supplemental oxygen).
- At 40,000 ft: TUC approximately 15–30 seconds.

Types of hypoxia:
- Hypoxic hypoxia: insufficient oxygen in the air (altitude, lung disease).
- Hypemic (anaemic) hypoxia: insufficient oxygen-carrying capacity of blood. Carbon monoxide poisoning (CO binds to haemoglobin 250× more readily than O₂): headache, dizziness, impaired vision.
- Stagnant hypoxia: circulatory problem — blood not reaching tissues.
- Histotoxic hypoxia: cells cannot use oxygen (alcohol, drugs, cyanide poisoning).

Hyperventilation: excessive breathing rate, blowing off CO₂ (hypocapnia). Symptoms: tingling extremities, dizziness, visual disturbances, muscle spasms, unconsciousness. Treatment: slow breathing rate. Symptoms are similar to hypoxia — if in doubt, go to oxygen.`,

    `CHAPTER 3: FATIGUE, SLEEP, AND CIRCADIAN RHYTHMS

Fatigue: a physiological state of reduced mental or physical performance capability resulting from sleep loss, extended wakefulness, circadian phase, or workload.

Sleep:
- Normal adult requires 7–9 hours of sleep per 24 hours.
- Sleep architecture: NREM (non-REM) and REM sleep cycle approximately every 90 minutes.
  * Stage 1 NREM: transition to sleep. Easy to wake.
  * Stage 2 NREM: light sleep. Body temperature and heart rate decrease.
  * Stages 3–4 NREM (slow-wave/deep sleep): most restorative. Difficult to wake. Memory consolidation.
  * REM sleep: dreaming. Muscle atonia. Brain activity similar to waking.
- Sleep debt: cumulative deficit. Cannot be eliminated by one long sleep. Impairs performance similarly to alcohol: 17 hours awake ≈ 0.05% BAC; 24 hours awake ≈ 0.10% BAC.

Circadian rhythm: approximately 24-hour biological clock regulated by the suprachiasmatic nucleus (SCN). Governed by zeitgebers (time cues), primarily light.
- Core body temperature troughs at approximately 0300–0500 local time — performance nadir.
- Alertness, reaction time, and cognitive performance follow circadian pattern.

Jet lag: misalignment between internal circadian clock and the new time zone. Symptoms: insomnia, daytime sleepiness, fatigue, impaired cognition, GI disturbance.
- Eastward travel (phase advance): harder to adapt. Clock must move forward.
- Westward travel (phase delay): easier. Rate of adaptation: approximately 1.5 hours/day eastward, 1 hour/day westward.

Effects of fatigue on performance:
- Slowed reaction time.
- Reduced attention span.
- Impaired decision making and increased risk-taking.
- Memory lapses.
- Microsleeps (involuntary sleep episodes of 3–15 seconds).

Countermeasures: strategic napping (10–20 minutes = "power nap" optimal), controlled rest on flight deck (regulations permitting), caffeine (effective but delays sleep if taken late), light exposure management.`,
  ],
};

// ── PDF generation ────────────────────────────────────────────────────────────

async function generatePDF(filename: string, chapters: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const outPath = path.join(PDF_DIR, `${filename}.pdf`);
    const stream = fs.createWriteStream(outPath);

    doc.pipe(stream);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(filename.replace(/-/g, " "), { align: "center" })
      .moveDown(0.5)
      .fontSize(12)
      .font("Helvetica")
      .text("ATPL Study Material — Synthetic Reference Document", { align: "center" })
      .moveDown(2);

    for (const chapter of chapters) {
      const lines = chapter.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          doc.moveDown(0.4);
          continue;
        }
        if (trimmed.startsWith("CHAPTER")) {
          doc.addPage()
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(trimmed)
            .moveDown(0.8)
            .fontSize(10.5)
            .font("Helvetica");
        } else {
          doc.fontSize(10.5).font("Helvetica").text(trimmed, { lineGap: 2 });
        }
      }
    }

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function main() {
  console.log("Generating synthetic ATPL PDFs…\n");

  for (const [filename, chapters] of Object.entries(subjects)) {
    await generatePDF(filename, chapters);
    console.log(`  ✓ pdfs/${filename}.pdf`);
  }

  console.log(`\nGenerated ${Object.keys(subjects).length} PDFs in ./pdfs/`);
  console.log("Run: npm run ingest");
}

main().catch((e) => { console.error(e); process.exit(1); });
