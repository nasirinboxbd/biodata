import React, { useState } from 'react';

interface SolarAvatarProps {
  photoUrl: string;
  name: string;
}

export const SolarAvatar: React.FC<SolarAvatarProps> = ({ photoUrl, name }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="avatar-system">
      {/* Central Portrait with gradient border */}
      <div className="avatar-photo">
        {imgError ? (
          <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-[var(--bg2)] to-[var(--bg)] border-[3.5px] border-[var(--gold)] text-3xl font-serif text-[var(--gold)]">
            {name.charAt(0)}
          </div>
        ) : (
          <img
            src={photoUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full rounded-full object-cover object-top border-[3.5px] border-transparent"
            style={{
              background:
                'linear-gradient(var(--bg2), var(--bg2)) padding-box, linear-gradient(135deg, #f0b840, #e8547a, #b07fff, #38d9c0) border-box',
            }}
          />
        )}
      </div>

      {/* Orbit Shell 1 (Gold dashed - rotates CW) */}
      <div className="orbit-shell shell1">
        <div className="planet p1" />
        <div className="planet p2" />
      </div>

      {/* Orbit Shell 2 (Lavender dashed - rotates CCW) */}
      <div className="orbit-shell shell2">
        <div className="sat s1" />
        <div className="sat s2" />
      </div>

      {/* Orbit Shell 3 (Teal dashed - rotates CW slower) */}
      <div className="orbit-shell shell3">
        <div className="st1" />
      </div>
    </div>
  );
};
