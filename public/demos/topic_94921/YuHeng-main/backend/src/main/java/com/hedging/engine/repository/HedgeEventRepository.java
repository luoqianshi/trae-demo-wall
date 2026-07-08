package com.hedging.engine.repository;

import com.hedging.engine.entity.HedgeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HedgeEventRepository extends JpaRepository<HedgeEvent, Long> {

    List<HedgeEvent> findAllByOrderByCreatedAtDesc();
}
