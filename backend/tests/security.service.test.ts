import {describe,it,expect} from 'vitest';
import {
  ROLES,isRole,canManageMovies,canManageUsers,externalVideoSource,hashToken,
  makeResetToken,signAccess,signRefresh,verifyToken
} from '../src/services/security.service';

describe('Безопасность и правила доступа',()=>{
  it('есть ровно три роли',()=>expect(ROLES).toEqual(['viewer','editor','admin']));
  it('роль валидируется сервером',()=>{expect(isRole('viewer')).toBe(true);expect(isRole('owner')).toBe(false);});
  it('редактор может менять фильмы, зритель — нет',()=>{expect(canManageMovies('viewer')).toBe(false);expect(canManageMovies('editor')).toBe(true);expect(canManageMovies('admin')).toBe(true);});
  it('пользователями управляет только администратор',()=>{expect(canManageUsers('viewer')).toBe(false);expect(canManageUsers('editor')).toBe(false);expect(canManageUsers('admin')).toBe(true);});
  it('хэш токена детерминирован, но не содержит оригинал',()=>{expect(hashToken('secret')).toHaveLength(64);expect(hashToken('secret')).toBe(hashToken('secret'));expect(hashToken('secret')).not.toContain('secret');});
  it('случайные токены уникальны',()=>{expect(makeResetToken()).not.toBe(makeResetToken());expect(makeResetToken()).toHaveLength(64);});
  it('access JWT можно проверить только как access',()=>{const t=signAccess('abc');expect(verifyToken(t,'access').sub).toBe('abc');expect(()=>verifyToken(t,'refresh')).toThrow();});
  it('refresh JWT нельзя использовать вместо access',()=>{const t=signRefresh('def');expect(verifyToken(t,'refresh').sub).toBe('def');expect(()=>verifyToken(t,'access')).toThrow();});
  it('случайная строка не является JWT',()=>{expect(()=>verifyToken('random','access')).toThrow();});
});
describe('Проверка ссылок на видео',()=>{
  it('принимает прямые ссылки MP4',()=>{const s=externalVideoSource('https://media.example.com/clip.mp4');expect(s.sourceType).toBe('external');});
  it('преобразует ссылку YouTube в безопасный embed',()=>{const s=externalVideoSource('https://youtu.be/dQw4w9WgXcQ');expect(s.sourceType).toBe('embed');expect(s.url).toContain('youtube-nocookie.com/embed/');});
  it('принимает Vimeo',()=>expect(externalVideoSource('https://vimeo.com/123456').sourceType).toBe('embed'));
  it('не разрешает javascript и неизвестные форматы',()=>{
    expect(()=>externalVideoSource('javascript:alert(1)')).toThrow();
    expect(()=>externalVideoSource('https://example.com/test.html')).toThrow();
    expect(()=>externalVideoSource('invalid')).toThrow();
  });
  it('отвергает неправильное видео YouTube',()=>expect(()=>externalVideoSource('https://youtu.be/abc')).toThrow());
  it('не даёт встроить ссылки с логином/паролем',()=>expect(()=>externalVideoSource('https://u:p@media.example.com/a.mp4')).toThrow());
});
