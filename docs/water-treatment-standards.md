# Water Treatment Standards Reference

Verified against: EPA SWTR (40 CFR 141), AWWA M37/M68, Ten States Standards (2022), Oregon OHA, HHS/PHS, LT2ESWTR.
Last verified: 2026-02-23.

## Alarm Thresholds

| Tag | Parameter | LL | L | H | HH | Unit | Regulatory basis |
|-----|-----------|----|----|----|----|------|-----------------|
| INT-FIT-001 | Raw Water Flow | 0.5 | 1.0 | 8.5 | 9.5 | MGD | Operational |
| INT-AIT-001 | Raw Turbidity | — | — | 200 | 500 | NTU | Operational |
| INT-PDT-001 | Screen DP | — | — | 5 | 8 | PSI | Operational |
| COG-AIT-001 | Floc Basin Turbidity | — | — | 50 | 100 | NTU | Operational |
| SED-AIT-001 | Clarifier Turbidity | — | — | 5 | 10 | NTU | Operational |
| SED-LIT-001 | Sludge Blanket Level | — | — | 4 | 6 | ft | Operational |
| FLT-PDT-001 | Filter Head Loss | — | — | 7 | 9 | ft | AWWA (terminal HL 6–9 ft) |
| FLT-AIT-001 | Filter Effluent Turbidity | — | — | 0.3 | 0.5 | NTU | LT2ESWTR 95th pct / 40 CFR 141 |
| DIS-AIT-001 | Plant Cl₂ Residual | 0.3 | 0.5 | 3.0 | 4.0 | mg/L | HH = EPA MRDL (40 CFR 141.65) |
| DIS-AIT-002 | Dist. Cl₂ Residual | 0.2 | 0.3 | 2.0 | — | mg/L | LL = EPA SWTR min (40 CFR 141.72) |
| DIS-AIT-003 | Finished Water pH | 6.5 | 6.8 | 8.0 | 8.5 | S.U. | EPA SMCL 6.5–8.5; Lead & Copper Rule |
| DIS-AIT-004 | Fluoride Residual | 0.5 | 0.7 | 1.0 | 1.2 | mg/L | L = HHS/PHS optimal 0.7 mg/L (2015) |

## Process Calculation Constants

### Intake
| Constant | Value | Unit | Basis |
|----------|-------|------|-------|
| Pump max flow | 4.5 | MGD each | Design |
| Screen drift rate | 0.0005 | PSI/simulated-s | Operational |
| Wet-well equilibrium flow | ~3.5 | MGD | naturalInflow 0.07 / outflow factor 0.02 |

### Coagulation
| Constant | Value | Basis |
|----------|-------|-------|
| Alum dose range | 0–80 mg/L | AWWA M37; typical 10–50 mg/L |
| Max turbidity removal | 85% | AWWA; jar-test literature |
| Alum-turbidity ratio constant | 0.12 | Dimensionless saturation model |
| Temperature factor range | 0.35 (1°C) – 1.0 (20°C) | MDPI *Environments* 2026; Aquasan.ca |
| Rapid mix target | 120 RPM | Low end of 100–400 RPM full-scale range |
| Slow mix target | 45 RPM | Turbine-type flocculators 15–60 RPM |
| Rapid mix G value reference | 600–1,000 s⁻¹ | AWWA; Virginia 12VAC5-590-871 |
| Slow mix G value reference | 10–75 s⁻¹ | Ten States Standards (GT = 20,000–200,000) |

### Sedimentation
| Constant | Value | Basis |
|----------|-------|-------|
| Clarifier base efficiency | 90% | Oregon OHA 2024; AWWA (85–95% range) |
| Sludge blanket max impact | 50% efficiency loss at 6 ft | IWA Publishing |
| Backwash duration | 600 s (10 min) | Oregon OHA; AWWA (5–20 min range) |
| Max filter runtime | 72 h | AWWA Opflow (24–72 h range) |
| Breakthrough onset | 6 ft | Iowa State filtration notes; AWWA |
| Breakthrough full | 9 ft | AWWA (9–12 ft range) |
| Clean filter starting head loss | 0.5 ft | AWWA (0.2–1.15 ft range) |
| Filter normal turbidity pass-through | 5% (95% removal) | SWTR; LT2ESWTR |

### Disinfection
| Constant | Value | Basis |
|----------|-------|-------|
| Chlorine dose efficiency | 85% | WHO; AWWA (50–90% depending on demand) |
| Cl₂ turbidity demand | 0.1 mg/L per NTU | Simplified NOM-demand model |
| Chlorine dose range | 0–10 mg/L | EPA; AWWA |
| Distribution decay constant | 0.05 /simulated-s | Simulator approximation (scales with dt) |
| Fluoride dose efficiency | 90% | AWWA (85–95% range) |
| Fluoride dose range | 0–2 mg/L | CDC; EPA |
| pH base | 7.0 S.U. | AWWA corrosion control |
| pH adjustment factor | 0.2 S.U./(mg/L) | AWWA M68; within 0.1–0.3 range |
| Finished water pH target | 7.4 S.U. | Lead & Copper Rule optimal 7.2–7.8 |
| Clearwell max level | 20 ft | Design |

## Sources
- [40 CFR Part 141 Subpart H — Filtration and Disinfection](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-141/subpart-H)
- [EPA Surface Water Treatment Rules](https://www.epa.gov/dwreginfo/surface-water-treatment-rules)
- [EPA Fluoride in Drinking Water](https://www.epa.gov/sdwa/fluoride-drinking-water)
- [2022 Ten States Standards (Recommended Standards for Water Works)](https://files.dep.state.pa.us/Water/BSDW/Public_Water_Supply_Permits/2022_Recommended_Standards_for_Water_Supply_Permits/2022_Recommended_Standards_for_Water_Works.pdf)
- [Oregon OHA Coagulation Guide](https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/OPERATIONS/TREATMENT/Documents/Coagulation.pdf)
- [Oregon OHA Clarification/Sedimentation (2024)](https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/OPERATIONS/TREATMENT/Documents/swcf/CFDF-3-2024/CFDF-c-6pp.pdf)
- [Oregon OHA Backwash Filter Operations](https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/OPERATIONS/TREATMENT/Documents/Backwash.pdf)
- [Washington DOH Optimizing Backwash](https://doh.wa.gov/sites/default/files/2022-02/331-624.pdf)
- [MDPI Environments — Low Temperature Coagulation (2026)](https://www.mdpi.com/2076-3198/13/1/40)
- [HHS/PHS Fluoride Recommendation 0.7 mg/L (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4547570/)
- [Virginia Code 12VAC5-590-871 Coagulation & Flocculation](https://law.lis.virginia.gov/admincode/title12/agency5/chapter590/section871/)
- [NC DEQ CT Disinfection Reference Guide](https://files.nc.gov/ncdeq/Water%20Resources/files/pws/awop/The-CT-Method---A-Reference-Guide.pdf)
