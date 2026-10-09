/** The story told around each merged PR. Numbers (diff size, dates, files) come from src/data/github.json. */
export interface PrStory {
  /** `owner/repo#number` */
  id: string;
  beat: string;
  kicker: string;
  title: string;
  body: string;
}

export const prStories: PrStory[] = [
  {
    id: 'navyabijoy/invisible-notes#15',
    beat: 'oss:note',
    kicker: 'First merged PR',
    title: 'It started with a sticky note.',
    body: 'invisible-notes keeps sticky notes out of screen shares and recordings. On Windows, waking from sleep quietly switched that protection off. The fix re-applies it after resume.',
  },
  {
    id: 'FreeCAD/FreeCAD#32340',
    beat: 'oss:navicube',
    kicker: 'FreeCAD · Gui',
    title: 'The gap that ate clicks.',
    body: 'The NaviCube’s view-menu button was drawn as two shapes — a bar and a triangle — with a gap between them. Clicks in the gap simply did nothing. Now the button is one hit target.',
  },
  {
    id: 'FreeCAD/FreeCAD#32476',
    beat: 'oss:3mf',
    kicker: 'FreeCAD · Mesh',
    title: 'Two lines for a missing format.',
    body: 'FreeCAD could already import 3MF meshes. The Import Mesh dialog just never listed *.3mf in its “all mesh files” filter, so nobody found it. Now it does.',
  },
  {
    id: 'FreeCAD/FreeCAD#32629',
    beat: 'oss:clipper',
    kicker: 'FreeCAD · Core',
    title: 'One line, one comma.',
    body: 'The About dialog printed “Clipper2 ,” because the bundled library’s version never left its subdirectory. One CMake line copies it up, so it reads “Clipper2 2.0.1,”.',
  },
];
