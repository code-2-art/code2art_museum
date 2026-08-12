import * as THREE from "three";

export const GALLERY_COLORS = {
  background: new THREE.Color("#080807"),
  paper: new THREE.Color("#f0eadf"),
  vermilion: new THREE.Color("#d9482f"),
  moss: new THREE.Color("#4e8155"),
  brass: new THREE.Color("#9a7642"),
  stone: new THREE.Color("#2f2a22"),
  charcoal: new THREE.Color("#171713")
} as const;

export type GalleryZone = {
  id: "atrium" | "construction" | "community" | "deep-archive";
  label: string;
  title: string;
  description: string;
  position: THREE.Vector3;
};

export const GALLERY_ZONES: GalleryZone[] = [
  {
    id: "atrium",
    label: "入口庭院 / Archive Atrium",
    title: "入口庭院",
    description: "从中央的朱红档案核进入馆藏，向两侧分流到建造过程与社区关系。",
    position: new THREE.Vector3(0, 1.65, 4.5)
  },
  {
    id: "construction",
    label: "建造现场 / Prompt · Code · Test",
    title: "AI 建造现场",
    description: "Prompt、代码、测试与决策以可穿行的过程墙组织，而不是被藏进最终成品。",
    position: new THREE.Vector3(-8, 1.65, -15)
  },
  {
    id: "community",
    label: "社区星图 / Community Constellation",
    title: "社区星图",
    description: "作品、项目与成员之间的关系被展开为可漫游的绿色星图。",
    position: new THREE.Vector3(8, 1.65, -17)
  },
  {
    id: "deep-archive",
    label: "深层档案 / Living Archive",
    title: "深层档案",
    description: "时间、版本和贡献记录延伸到展厅深处，保持为可继续生长的档案。",
    position: new THREE.Vector3(0, 1.65, -32)
  }
];

export const AUTO_TOUR_PATH = [
  new THREE.Vector3(0, 1.65, 4.5),
  new THREE.Vector3(0, 1.65, -3.5),
  new THREE.Vector3(-7.5, 1.65, -13),
  new THREE.Vector3(-2, 1.65, -20),
  new THREE.Vector3(7.5, 1.65, -18),
  new THREE.Vector3(3, 1.65, -27),
  new THREE.Vector3(0, 1.65, -34),
  new THREE.Vector3(0, 1.65, -13)
] as const;

export const GALLERY_BOUNDS = new THREE.Box2(
  new THREE.Vector2(-13.8, -36),
  new THREE.Vector2(13.8, 6.2)
);

export const CENTRAL_ARCHIVE = {
  center: new THREE.Vector2(0, -8.5),
  radius: 3.1
} as const;
