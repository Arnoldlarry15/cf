import * as THREE from 'three';

export interface OctreeItem {
  id: string;
  index: number;
  position: THREE.Vector3;
}

export class OctreeNode {
  bounds: THREE.Box3;
  items: OctreeItem[] = [];
  children: OctreeNode[] | null = null;
  capacity: number;
  depth: number;
  maxDepth: number;

  constructor(bounds: THREE.Box3, capacity = 16, depth = 0, maxDepth = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.depth = depth;
    this.maxDepth = maxDepth;
  }

  insert(item: OctreeItem): boolean {
    if (!this.bounds.containsPoint(item.position)) {
      return false;
    }

    if (this.children) {
      for (const child of this.children) {
        if (child.insert(item)) return true;
      }
      return false;
    }

    this.items.push(item);

    if (this.items.length > this.capacity && this.depth < this.maxDepth) {
      this.subdivide();
    }

    return true;
  }

  subdivide() {
    const min = this.bounds.min;
    const max = this.bounds.max;
    const mid = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);

    this.children = [
      new OctreeNode(new THREE.Box3(min, mid), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(mid.x, min.y, min.z), new THREE.Vector3(max.x, mid.y, mid.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(min.x, mid.y, min.z), new THREE.Vector3(mid.x, max.y, mid.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(mid.x, mid.y, min.z), new THREE.Vector3(max.x, max.y, mid.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(min.x, min.y, mid.z), new THREE.Vector3(mid.x, mid.y, max.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(mid.x, min.y, mid.z), new THREE.Vector3(max.x, mid.y, max.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(new THREE.Vector3(min.x, mid.y, mid.z), new THREE.Vector3(mid.x, max.y, max.z)), this.capacity, this.depth + 1, this.maxDepth),
      new OctreeNode(new THREE.Box3(mid, max), this.capacity, this.depth + 1, this.maxDepth),
    ];

    const currentItems = [...this.items];
    this.items = [];

    for (const item of currentItems) {
      for (const child of this.children) {
        if (child.insert(item)) break;
      }
    }
  }

  querySphere(center: THREE.Vector3, radius: number, found: OctreeItem[] = []): OctreeItem[] {
    const sphereBox = new THREE.Box3().setFromCenterAndSize(
      center,
      new THREE.Vector3(radius * 2, radius * 2, radius * 2)
    );

    if (!this.bounds.intersectsBox(sphereBox)) {
      return found;
    }

    for (const item of this.items) {
      if (item.position.distanceTo(center) <= radius) {
        found.push(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.querySphere(center, radius, found);
      }
    }

    return found;
  }
}
