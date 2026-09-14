/**
 * Placeholder family rankings.
 *
 * There is no family concept in the API — no groups, memberships or per-period
 * totals — so this screen is presentation only. Names and figures here are
 * invented; replace the whole file once a families endpoint exists.
 */
export type FamilyEntry = {
  id: string
  name: string
  crest: string
  views: number
}

const crest = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=160&q=80`

export const families: FamilyEntry[] = [
  { id: 'f1', name: 'Night Owls', crest: crest('1520962880247-cfaf541c8724'), views: 3_305_050 },
  { id: 'f2', name: 'Golden Hour', crest: crest('1533109721025-d1ae7ee7c1e1'), views: 2_243_354 },
  { id: 'f3', name: 'Nebula Club', crest: crest('1462331940025-496dfbfc7564'), views: 1_532_932 },
  { id: 'f4', name: 'Moonrise Union', crest: crest('1419242902214-272b3f66ee7a'), views: 1_111_827 },
  { id: 'f5', name: 'Seven Stars', crest: crest('1444927714506-8492d94b4e3d'), views: 917_462 },
  { id: 'f6', name: 'The Wolf Pack', crest: crest('1518709268805-4e9042af2176'), views: 840_029 },
  { id: 'f7', name: 'Lantern Society', crest: crest('1465101162946-4377e57745c3'), views: 789_014 },
  { id: 'f8', name: 'Old Legends', crest: crest('1451187580459-43490279c0fa'), views: 668_306 },
  { id: 'f9', name: 'Velvet Room', crest: crest('1470071459604-3b5ec3a7fe05'), views: 643_867 },
  { id: 'f10', name: 'Crown Court', crest: crest('1478760329108-5c3ed9d495a0'), views: 561_664 },
  { id: 'f11', name: 'Harbour Lights', crest: crest('1439066615861-d1af74d74000'), views: 529_034 },
  { id: 'f12', name: 'Unity Agency', crest: crest('1494232410401-ad00d5433cfa'), views: 527_814 },
]
