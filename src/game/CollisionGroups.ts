/**
 * rapier js 2 uses 16-bit bit masks to describe a collider's collision filter
 * the left-most 16 bits describe what group it belongs to, the right-most what it collides with
 * so constructing a collision filter is done like this:
 * 
 * collider.setCollisionGroups(
 *  CollisionGroup.GroupThingBelongsTo << 16 | CollisionGroup.GroupThingShouldCollideWith1 | CollisionGroup.GroupThingShouldCollideWith2
 * )
 * 
 * the left shift operator (<< 16) shifts the group 16 bits over to the left, making it 32-bit
 * the bitwise OR | combines the bit masks, ie. 0010 | 0001 = 0011
 */
enum CollisionMember {
  GameBoundary = 0b0000_0000_0000_0001, // 16-bit binary representation (0b) of 1
  PitchBoundary = 0b0000_0000_0000_0010, // 2
  Ball = 0b0000_0000_0000_0100, // 4
  Player = 0b0000_0000_0000_1000, // 8
}

export enum CollisionGroup {
  GameBoundary = CollisionMember.GameBoundary << 16 | CollisionMember.Ball | CollisionMember.Player,
  PitchBoundary = CollisionMember.PitchBoundary << 16 | CollisionMember.Ball,
  Ball = CollisionMember.Ball << 16 | CollisionMember.GameBoundary | CollisionMember.PitchBoundary | CollisionMember.Ball | CollisionMember.Player,
  Player = CollisionMember.Player << 16 | CollisionMember.GameBoundary | CollisionMember.Ball | CollisionMember.Player,
}
