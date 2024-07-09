import { MeshStandardMaterial } from "three";

const colors = {
    ground: 0x333333,
    pavement: 0x999999,
    background: 0xffffff,
    // background: 0x000000,
    wall: 0xff9999, //0xf4e4d5,
    window: 0x333333,
    alu: 0x111111,
    white: 0xffffff,
    awening: 0x0000ff,
    wood: 0xffffff,
    floor: 0x864427,
    roof: 0x330000,
    green: 0x008833
};

let groundMaterial = new MeshStandardMaterial({
    color: colors.ground,
    transparent: true,
    opacity: 0.5,
});

export { colors, groundMaterial };