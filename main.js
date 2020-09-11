class Map{
  constructor(nm, pkgNm, lvls){
    this.name = nm;
    this.pkgName = pkgNm;
    this.levels = lvls;
  }

}
class Level{
  constructor(nm, x, y, w, h, ent, sol, tile, trig){
    this.name = nm;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.entities = ent;
    this.solids = sol;
    this.tileset = tile;
    this.triggers = trig;
  }
}
class Entity{

}
class Solid{

}
class Tileset{

}
class Trigger{
  
}
