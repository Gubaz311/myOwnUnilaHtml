UPDATE mahasiswa
SET "jenisKelamin" = CASE
    WHEN npm = '1816021045' THEN 'Perempuan'
    WHEN npm = '1816031033' THEN 'Perempuan'
    WHEN npm = '1857051013' THEN 'Laki-Laki'

END
WHERE npm IN ('1816021045', '1816031033', '1857051013');
