
publish: clean
ifndef VERSION
	$(error VERSION is undefined for Test Event Store Release)
endif
	cd java && echo currentVersion=$(VERSION)>gradle.properties
	cd java && ./gradlew artifactoryPublish
	cd java && git add gradle.properties
	git commit -m "Update version to $(VERSION )while publishing"
	git push origin

test:
	cd java && SHORT_TEST=true ./gradlew check

clean:
	cd java && ./gradlew clean
