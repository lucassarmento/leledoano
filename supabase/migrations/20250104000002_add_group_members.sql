-- Add group members to allowed_phones
INSERT INTO allowed_phones (phone, name, is_admin) VALUES
  ('+5521981630099', 'Fred Mastrangelo', false),
  ('+5521999954992', 'Inacio', false),
  ('+5521971889668', 'Joao Pedrinho', false),
  ('+5521984805505', 'Lucas Guillen', false),
  ('+5521991165586', 'Paulo Di Celio', false),
  ('+447832706000', 'Pedro Zuim', false),
  ('+5521988129274', 'Tarso Barreto', false),
  ('+5521992376998', 'Bandit Rio', false),
  ('+5521974007677', 'Marc Werner', false),
  ('+5521991602141', 'Rafael Di Celio', false)
ON CONFLICT (phone) DO NOTHING;
