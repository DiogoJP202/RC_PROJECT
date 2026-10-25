import { describe, expect, it } from 'vitest';
import { Group, Object3D } from 'three';
import { isEffectivelyVisible } from './visibility';

describe('effective visibility for anatomy picking', () => {
  it('accepts a visible object and a fully visible ancestor chain', () => {
    const scene = new Group();
    const group = new Group();
    const target = new Object3D();
    scene.add(group); group.add(target);
    expect(isEffectivelyVisible(scene)).toBe(true);
    expect(isEffectivelyVisible(target)).toBe(true);
  });

  it('rejects a hidden hit target even when its ancestors are visible', () => {
    const group = new Group();
    const target = new Object3D();
    group.add(target);
    target.visible = false;
    expect(isEffectivelyVisible(target)).toBe(false);
  });

  it('excludes pooled visible children from transparent-surface pass-through when their group is hidden', () => {
    const manifestation = new Group();
    const appendage = new Object3D();
    manifestation.add(appendage);
    manifestation.visible = false;
    expect(appendage.visible).toBe(true);
    expect([appendage].some(isEffectivelyVisible)).toBe(false);
    manifestation.visible = true;
    expect([appendage].some(isEffectivelyVisible)).toBe(true);
  });

  it('reflects distant ancestor changes and reparenting without stale visibility', () => {
    const hiddenAncestor = new Group();
    const group = new Group();
    const target = new Object3D();
    hiddenAncestor.add(group); group.add(target);
    hiddenAncestor.visible = false;
    expect(isEffectivelyVisible(target)).toBe(false);
    const visibleAncestor = new Group();
    visibleAncestor.add(group);
    expect(isEffectivelyVisible(target)).toBe(true);
    group.visible = false;
    expect(isEffectivelyVisible(target)).toBe(false);
  });
});
