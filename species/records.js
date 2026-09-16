/* ============================================================
   SPECIMEN RECORDS — Hell Creek Formation, Lancian faunal stage
   ============================================================ */
const SPECIES = {
  trex:{
    name:"Tyrannosaurus rex", say:"tie-RAN-oh-SORE-us", common:"Tyrant lizard king",
    mean:"The apex predator of the formation, and the last large theropod on Earth. Adults took roughly two decades to reach full size.",
    stats:[["Length","12.3 m"],["Hip height","3.7 m"],["Mass","≈ 8 000 kg"],["Bite force","≈ 35 000 N"],["Diet","Carnivore"]],
    notes:[
      "The spine is horizontal, head and tail balanced over the hips. The upright tail-dragging pose was abandoned in the 1970s and is skeletally impossible — the tail vertebrae will not bend that way.",
      "Teeth sit behind scaly lips at rest. Exposed crocodile-style fangs would dry out the enamel; the tooth surface texture argues for lips.",
      "Skin impressions from the neck, hip and tail are all scaly, so no shaggy coat here — but the arms are strong, and held with palms facing inward, never down."
    ]},
  trike:{
    name:"Triceratops prorsus", say:"try-SERRA-tops", common:"Three-horned face",
    mean:"The single most common large dinosaur in Hell Creek — more individuals have been collected than of any other big animal here.",
    stats:[["Length","8.0 m"],["Shoulder height","2.9 m"],["Mass","≈ 9 000 kg"],["Skull","2.4 m"],["Diet","Low browser"]],
    notes:[
      "Forelimbs are held semi-erect: the elbows bow slightly outward and the hands point forward-and-out. Neither a sprawling lizard nor a columnar rhino.",
      "Five fingers per hand, but only the inner three bear weight and carry hooves — the outer two are splints.",
      "The frill is solid bone in this genus, edged with fused epoccipitals that give the margin its scalloped wave. Skin impressions show large, nipple-like scales on the flanks."
    ]},
  edmonto:{
    name:"Edmontosaurus annectens", say:"ed-MON-toe-SORE-us", common:"Edmonton lizard",
    mean:"A herding hadrosaur that grew as long as Tyrannosaurus. Bone beds preserve hundreds of individuals together.",
    stats:[["Length","12.0 m"],["Hip height","3.3 m"],["Mass","≈ 7 600 kg"],["Teeth","≈ 1 000"],["Diet","Bulk herbivore"]],
    notes:[
      "Habitually quadrupedal. The forelimb ends in a fleshy mitten — the fingers are bound in a single pad, so there are no splayed dinosaur fingers pressing into the mud.",
      "A soft fleshy comb crowns the skull, preserved in the “dinosaur mummy” specimens. It is not bone, and it was missed for a century.",
      "It chews by letting the upper jaws flex outward as the lower jaw closes — pleurokinesis — not by grinding side to side like a cow."
    ]},
  anky:{
    name:"Ankylosaurus magniventris", say:"an-KYE-loh-SORE-us", common:"Fused lizard, big belly",
    mean:"The largest known ankylosaurid, and genuinely rare: it is known from only a handful of specimens.",
    stats:[["Length","6.5 m"],["Width","1.7 m"],["Mass","≈ 5 000 kg"],["Club","≈ 25 kg"],["Diet","Low herbivore"]],
    notes:[
      "The armour is a mosaic of separate osteoderms set in the skin in rows, not a fused turtle shell. Small ossicles fill the gaps between the big keeled plates.",
      "The tail club swings horizontally. The handle is locked rigid by interlocking vertebrae and ossified tendons, so it cannot whip — it is a mace, not a flail.",
      "Its species name means “big belly” for good reason: a wide barrel gut for fermenting low, tough vegetation."
    ]},
  dakota:{
    name:"Dakotaraptor steini", say:"da-KOH-ta-RAP-tor", common:"Dakota thief",
    mean:"A giant dromaeosaur, far larger than the Velociraptor of the films and living 9 000 km away from it in time and place.",
    stats:[["Length","4.6 m"],["Hip height","1.6 m"],["Mass","≈ 350 kg"],["Sickle claw","16 cm"],["Diet","Carnivore"]],
    notes:[
      "Fully feathered, with a true wing. Quill knobs are preserved on the ulna — the direct anchor points where large pennaceous feathers attached to bone.",
      "The palms face each other, like a person about to clap. A dromaeosaur wrist physically cannot pronate into the downward-facing “bunny hands” of old artwork.",
      "The sickle claw held on and pinned prey down. It was too blunt in cross-section to slit a hide open, and the foot was made for gripping."
    ]},
  anzu:{
    name:"Anzu wylei", say:"AN-zoo", common:"Feathered demon of the mud",
    mean:"A caenagnathid oviraptorosaur, nicknamed the “chicken from hell” when it was described in 2014.",
    stats:[["Length","3.5 m"],["Hip height","1.5 m"],["Mass","≈ 250 kg"],["Crest","Hollow bone"],["Diet","Omnivore"]],
    notes:[
      "The plumage is not speculative. Close oviraptorosaur relatives are preserved with pennaceous feathers on the arms and a fan on the tail tip, used for display.",
      "It is toothless: a sharp keratin beak, and a tall hollow crest above the eyes.",
      "Fossil oviraptorosaurs have been found brooding nests, sitting with the arms folded over the eggs the way a bird covers a clutch."
    ]},
  pachy:{
    name:"Pachycephalosaurus wyomingensis", say:"PACK-ee-KEF-uh-lo-SORE-us", common:"Thick-headed lizard",
    mean:"A bipedal plant-eater carrying 25 cm of solid bone on the roof of its skull.",
    stats:[["Length","4.5 m"],["Hip height","1.6 m"],["Mass","≈ 450 kg"],["Dome","25 cm thick"],["Diet","Mixed feeder"]],
    notes:[
      "Head-to-head ramming is contested. Some domes show healed injuries, but the neck joints are poorly built for absorbing a head-on hit — flank-butting fits the anatomy better.",
      "“Dracorex” and “Stygimoloch” are almost certainly this animal as a juvenile and a subadult: the spikes shrink and the dome inflates with age.",
      "Its teeth are small and leaf-shaped, so despite the armoured skull it was browsing on soft plants and possibly insects."
    ]},
  thescelo:{
    name:"Thescelosaurus neglectus", say:"THESS-el-oh-SORE-us", common:"Wonderful, neglected lizard",
    mean:"A small, heavy-bodied runner and one of the last non-avian dinosaurs — it is found right up against the impact boundary.",
    stats:[["Length","3.5 m"],["Hip height","1.0 m"],["Mass","≈ 250 kg"],["Femur","44 cm"],["Diet","Low herbivore"]],
    notes:[
      "The tail is laced with a lattice of ossified tendons, holding it out as a rigid balance beam behind the hips.",
      "Its huge nasal chambers and stout forelimbs hint at burrowing habits, matching close relatives found fossilised inside their own dens.",
      "The famous “fossilised heart” found in one specimen was reexamined and is a concretion of sediment — a good reminder of how reconstruction gets corrected."
    ]},
  // Not in ORDER yet: the field station's roster and "/ 8" tally expect a
  // model placed on the floodplain for every entry there.
  quetzal:{
    name:"Quetzalcoatlus northropi", say:"KET-sal-koh-AT-lus", common:"Feathered-serpent god",
    mean:"A giant azhdarchid pterosaur — not a dinosaur — and one of the largest animals ever to fly. Named from Texas; azhdarchids of the same kind flew over Hell Creek.",
    stats:[["Wingspan","≈ 10 m"],["Standing height","≈ 4.5 m"],["Mass","≈ 200–250 kg"],["Skull","≈ 2 m"],["Diet","Terrestrial stalker"]],
    notes:[
      "On the ground it walks on all fours. The enormous wing finger folds up and back along the arm, and the hand prints fall outside and ahead of the feet.",
      "It launched with its arms, vaulting off the forelimbs the way a vampire bat does, not by running and flapping like a bird.",
      "The long, stiff neck and toothless beak suit picking small animals off the ground, stork-fashion, rather than skimming fish from the water."
    ]}
};
const ORDER = ["trex","trike","edmonto","anky","dakota","anzu","pachy","thescelo"];


export { SPECIES, ORDER };
