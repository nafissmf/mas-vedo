CREATE TABLE IF NOT EXISTS responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  respondent_code CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  work_unit VARCHAR(150) NOT NULL,
  position VARCHAR(150) NOT NULL,
  years_of_service VARCHAR(100) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_respondent_code (respondent_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  response_id BIGINT UNSIGNED NOT NULL,
  question_key VARCHAR(32) NOT NULL,
  variable_code VARCHAR(8) NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_response_question (response_id, question_key),
  CONSTRAINT fk_answers_response FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
  CONSTRAINT chk_score CHECK (score BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
