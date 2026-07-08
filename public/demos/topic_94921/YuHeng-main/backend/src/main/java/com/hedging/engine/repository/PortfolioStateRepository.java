package com.hedging.engine.repository;

import com.hedging.engine.entity.PortfolioState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioStateRepository extends JpaRepository<PortfolioState, Long> {
}
